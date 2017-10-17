/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/ui/Device","sap/ui/model/json/JSONModel","sap/ui/model/odata/v2/ODataModel","./NavigationManager","./messages","./utilities","nw/epm/refapps/ext/prod/manage/model/Products","nw/epm/refapps/ext/prod/manage/model/formatter"],function(O,D,J,a,N,m,u,P,f){"use strict";function I(A){var b={isBusyDeleting:true,isBusyCreatingDraft:true,isBusySaving:true,metaDataLoadState:0,lostDraftReadState:0},r=function(){var i=false;for(var s in b){var e=b[s];var v=A.getProperty("/"+s);if(e===v){i=true;A.setProperty("/detailBusyIndicatorDelay",0);break;}}A.setProperty("/isAppBusy",i);};for(var p in b){var B=A.bindProperty("/"+p);B.attachChange(r);}}return O.extend("nw.epm.refapps.ext.prod.manage.controller.Application",{constructor:function(c,r){this._oComponent=c;this._mRoutes=r;},init:function(s){this._oMainView=this._oComponent.getAggregation("rootControl");this._oOnMetaData={onSuccess:[],onFailure:[]};var o=this._oComponent.getModel();o.attachMetadataLoaded(this.onMetadataLoaded,this);o.attachMetadataFailed(this.onMetadataFailed,this);this._oApplicationProperties=new J({serviceUrl:s,metaDataLoadState:0,lostDraftReadState:-1,isBusyDeleting:false,isBusyCreatingDraft:false,isBusySaving:false,isAppBusy:true,detailBusyIndicatorDelay:0,masterBusyIndicatorDelay:0,applicationController:this,isMultiSelect:false,noEditMode:true,preferredIds:[],isDirty:false,lastDisplay:null,isListLoading:false,listNoDataText:" "});this._oComponent.setModel(this._oApplicationProperties,"appProperties");I(this._oApplicationProperties);this._oDataHelper=new P(this._oComponent,this._oMainView);var r=this._oComponent.getRouter();this._oNavigationManager=new N(r,this._oApplicationProperties,this._mRoutes,this._oComponent.getModel("i18n").getResourceBundle());this._oNavigationManager.init();this._extractStartupParameters(r);},_extractStartupParameters:function(r){var c=this._oComponent.getComponentData();if(c&&c.startupParameters&&jQuery.isArray(c.startupParameters.Product)&&c.startupParameters.Product.length>0){var U=r.getURL(this._mRoutes.DETAIL,{productID:c.startupParameters.Product[0]});if(U){sap.ui.require(["sap/ui/core/routing/HashChanger"],function(H){var h=H.getInstance();h.replaceHash(U);});}}},registerMaster:function(M){this._oMasterController=M;this._oNavigationManager.registerMaster(M);},registerDetail:function(d){this._oNavigationManager.registerDetail(d);},onMetadataLoaded:function(){this._checkForLostDraft();this._oApplicationProperties.setProperty("/metaDataLoadState",1);this._oApplicationProperties.setProperty("/isListLoading",true);for(var i=0;i<this._oOnMetaData.onSuccess.length;i++){this._oOnMetaData.onSuccess[i]();}this._oOnMetaData=null;},onMetadataFailed:function(){this._oApplicationProperties.setProperty("/metaDataLoadState",-1);for(var i=0;i<this._oOnMetaData.onFailure.length;i++){this._oOnMetaData.onFailure[i]();}this._oOnMetaData={onSuccess:[],onFailure:[]};},navBackToMasterPageInPhone:function(){return this._oNavigationManager.navBackToMasterPageInPhone();},showProductDetailPage:function(p,l){this._oNavigationManager.showProductDetailPage(p,l);},navToMaster:function(p){this._oNavigationManager.navToMaster(p);},navToProductEditPage:function(d){this._oNavigationManager.navToProductEditPage(d);},navToEmptyPage:function(t,r){this._oNavigationManager.navToEmptyPage(t,r);},navBack:function(F){this._oNavigationManager.navBack(F,this._oDataHelper);},_checkForLostDraft:function(){this._oApplicationProperties.setProperty("/lostDraftReadState",0);var e=function(r){this._oApplicationProperties.setProperty("/lostDraftReadState",-1);m.showErrorMessage(r,this._oMainView);};this._oDataHelper.readProductDraft(this.handleLostDraft.bind(this),e.bind(this));},handleLostDraft:function(d,p){this._oApplicationProperties.setProperty("/lostDraftReadState",1);if(d){var l=this._oApplicationProperties.getProperty("/productId");if(l!==d&&!p.IsDirty){this._oDataHelper.deleteDraft(d);return;}this.navToProductEditPage(d);if(l===d){this._oApplicationProperties.setProperty("/isDirty",p.IsDirty);return;}var o,b=function(){o.close();this._oDataHelper.deleteDraft(d);if(l){this.showProductDetailPage(l);}else{this.navToMaster(!p.IsNew&&d);}}.bind(this),r=function(){this._oApplicationProperties.setProperty("/isDirty",true);o.close();}.bind(this);o=sap.ui.xmlfragment("nw.epm.refapps.ext.prod.manage.view.LostDraftDialog",{oResourceBundle:this._oComponent.getModel("i18n").getResourceBundle(),formatter:f,onDiscard:b,onResume:r});u.attachControlToView(this._oMainView,o);var c=new J({productDraft:p});o.setModel(c,"draft");o.open();}},deleteListener:function(b,p){if(b){this._beforeDelete(p);}else{this._afterDelete();}},_beforeDelete:function(p){var c=!D.system.phone&&this._oApplicationProperties.getProperty("/productId");this._oApplicationProperties.setProperty("/productId",null);if(c){var C=false,s=this._oDataHelper.getPathForProductId(c);for(var i=0;!C&&i<p.length;i++){C=s===p[i];}if(!C){this._oApplicationProperties.setProperty("/productId",c);return;}}if(this._oMasterController){this._oMasterController.prepareForDelete(c);}},_afterDelete:function(){this.navBackToMasterPageInPhone();if(!this._oApplicationProperties.getProperty("/isListLoading")){this._oMasterController.findItem();}},getODataHelper:function(){return this._oDataHelper;},whenMetadataLoaded:function(M,n){var i=this._oApplicationProperties.getProperty("/metaDataLoadState");if(i===1){if(M){M();}if(this._oApplicationProperties.getProperty("/lostDraftReadState")<0){this._checkForLostDraft();}}else{if(M){this._oOnMetaData.onSuccess.push(M);}if(n){this._oOnMetaData.onFailure.push(n);}if(i===-1){this._oApplicationProperties.setProperty("/metaDataLoadState",0);this._oComponent.getModel().refreshMetadata();}}},hideMasterInPortrait:function(){this._oMainView.getController().hideMaster();}});});