
// Author :GBS

///////////////////////////////////////////////////////////////////////////

define(
[
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/Deferred",
    "dojo/topic",
    "dojo/dom",
    "dojo/on",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/dom-style",
    'dojo/dom-class',
    "esri/geometry/Extent",
    "esri/tasks/GeometryService",
    "esri/tasks/BufferParameters",
    'esri/graphic',
    'jimu/dijit/Message'
   
], function (
  declare,
  array,
  connect,
  lang,
  Deferred,
  topic,
  dom,
  on,
  domQuery,
  domConstruct,
  domStyle,
  domClass,
  Extent,
  GeometryService,
  BufferParameters,
  Graphic,
  Message

) {
    var Buffer = declare("Buffer", null, {

        constructor: function (map, layer, config) {
            this._setMap(map);
            this._setLayer(layer);
            this._setConfig(config);
       
        },
        _setMap: function (map) {
            this._map = map;
        },
        _setLayer:function(layer){
            this._layer = layer;
        },
        _setConfig: function (config) {
            this.config = config;
        },
        setParams:function(a,b,c,d){
            this._distance = a;
            this._unit = b;
            this._symbology = c;
            this._graphic = d;
            this.activate();
        },
        activate: function () {
            var me = this;
         
            me.doBuffer(this._graphic).then(function (bufferGeom) {
                var bufferGraphic = new Graphic(bufferGeom, me._symbology);
                
                me._layer.add(bufferGraphic);
                if (bufferGraphic && bufferGraphic.getDojoShape()) {
                    if (me._distance < 0) {
                        bufferGraphic.getDojoShape().moveToFront();
                    } else {
                        bufferGraphic.getDojoShape().moveToBack();
                    }
                }

            }, function () {
                me._showErrorMessage();
            });
        },
        doBuffer: function (graphic) {
            var me = this;
            var bufDeferred = new Deferred();
            var geometryService = new GeometryService(this.config.geomServiceUrl);
            //setup the buffer parameters
            var params = new BufferParameters();
            params.distances = [this._distance];
            params.bufferSpatialReference = this._map.spatialReference;
            params.outSpatialReference = this._map.spatialReference;
            params.unit = GeometryService[this._unit];
            params.geometries = [graphic.geometry];

            this._toggleLoading(true);
            geometryService.buffer(params, function (bufferedGeometries) {
                me._toggleLoading(false);
                bufDeferred.resolve(bufferedGeometries[0]);
            }, function (err) {
                me._toggleLoading(false);
                bufDeferred.reject(err);
            });
            return bufDeferred.promise;
        },
        _showErrorMessage: function () {
            var popup = new Message({
                message: this.config.invalidRequestMessage,
                buttons: [{
                    label: "OK",
                    onClick: lang.hitch(this, function () {
                        topic.publish("INVALID_BUFFER_REQUEST");
                        popup.close();
                    })
                }]
            });
        },
        _toggleLoading: function (state) {
            topic.publish("LOADING_REQUEST",state);
        }
    });
    return Buffer;
});
