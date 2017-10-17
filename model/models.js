/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/json/JSONModel","sap/ui/Device","sap/ui/model/odata/v2/ODataModel","sap/ui/model/resource/ResourceModel"],function(J,D,O,R){"use strict";function e(u,m,s){var E={},S=new URI(s);u.forEach(function(U){var o,p;if(U==="sap-language"){var g=jQuery.sap.getObject("sap.ushell.Container.getUser");if(g){m["sap-language"]=g().getLanguage();}}else{o=jQuery.sap.getUriParameters();p=o.get(U);if(p){m[U]=p;S.addSearch(U,p);}}});jQuery.extend(m,E);return S.toString();}return{createODataModel:function(o){var u,c,U;o=o||{};if(!o.url){jQuery.sap.log.error("Please provide a url when you want to create an ODataModel","nw/epm/refapps/ext/prod/manage.model.models.createODataModel");return null;}c=jQuery.extend(true,{},o.config);u=o.urlParametersForEveryRequest||[];c.metadataUrlParams=c.metadataUrlParams||{};U=e(u,c.metadataUrlParams,o.url);return this._createODataModel(U,c);},_createODataModel:function(u,c){return new O(u,c);},createDeviceModel:function(){var m=new J(D);m.setDefaultBindingMode("OneWay");return m;},createResourceModel:function(r,a){this._resourceModel=new R({bundleUrl:[r,a].join("/")});return this._resourceModel;}};});
