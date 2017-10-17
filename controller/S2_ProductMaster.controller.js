/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/json/JSONModel","sap/ui/Device","sap/m/GroupHeaderListItem","sap/m/ListMode","./TableOperations","./SubControllerForFGS","nw/epm/refapps/ext/prod/manage/model/formatter"],function(C,J,D,G,L,T,S,f){"use strict";return C.extend("nw.epm.refapps.ext.prod.manage.controller.S2_ProductMaster",{formatter:f,onInit:function(){this._iMarkedCount=0;this._sCurrentSearchTerm="";this._oView=this.getView();this._oList=this.byId("list");this._oSearchField=this.byId("SearchField");var c=this.getOwnerComponent();this._oApplicationProperties=c.getModel("appProperties");this._oApplicationController=this._oApplicationProperties.getProperty("/applicationController");this._oApplicationController.registerMaster(this);this._oResourceBundle=c.getModel("i18n").getResourceBundle();this._oHelper=this._oApplicationController.getODataHelper();this._oTableOperations=new T(this._oList,["Name","Id","Description"]);this._initViewPropertiesModel();this._oSubControllerForFGS=new S(this._oView,this._oTableOperations,this.applyTableOperations.bind(this),this._oResourceBundle);},_initViewPropertiesModel:function(){this._oViewProperties=new J({title:this._oResourceBundle.getText("xtit.masterTitleWithoutNumber"),markExists:false,filterToolbarVisible:false,filterInfoText:""});this._oView.setModel(this._oViewProperties,"viewProperties");},applyTableOperations:function(){this._oTableOperations.applyTableOperations();if(!D.system.phone){this._fnAdaptListAfterUpdate=function(){var p=this._oApplicationProperties.getProperty("/productId"),l=this._getListItemForId(p);this._scrollToListItem(l);}.bind(this);}},createGroupHeader:function(g){return new G({title:g.text,upperCase:false});},onUpdateStarted:function(){this._oSearchField.setValue(this._sCurrentSearchTerm);this._oApplicationProperties.setProperty("/isListLoading",true);},onUpdateFinished:function(){if(this._oApplicationProperties.getProperty("/metaDataLoadState")<1){return;}this._oApplicationProperties.setProperty("/isListLoading",false);this._oApplicationProperties.setProperty("/masterBusyIndicatorDelay",null);var c=this._getListBinding().getLength(),t=this._oResourceBundle.getText("xtit.masterTitleWithNumber",[c]);this._oViewProperties.setProperty("/title",t);if(c===0){var n=((this._oTableOperations.getSearchTerm()||this._oTableOperations.getFilterTable())?"ymsg.noDataAfterSerach":"ymsg.noProducts");this._oApplicationProperties.setProperty("/listNoDataText",this._oResourceBundle.getText(n));}if(this._isListInMultiSelectMode()){this._iMarkedCount=this._oList.getSelectedContexts(true).length;this._oViewProperties.setProperty("/markExists",this._iMarkedCount>0);}this.findItem();if(this._fnAdaptListAfterUpdate){this._fnAdaptListAfterUpdate();this._fnAdaptListAfterUpdate=null;}},listRefresh:function(){this._getListBinding().refresh();},adaptToDetailSelection:function(s){if(this._oApplicationProperties.getProperty("/isListLoading")||this._oApplicationProperties.getProperty("/metaDataLoadState")<1){this._fnAdaptListAfterUpdate=this._selectCurrentItem.bind(this,s);}else{this._selectCurrentItem(s);}},_selectCurrentItem:function(s){if(D.system.phone||this._isListInMultiSelectMode()){return;}var p=this._oApplicationProperties.getProperty("/productId"),i=p&&this._getListItemForId(p);if(i===this._oList.getSelectedItem()){return;}this._setItemSelected(i);if(s&&i){this._scrollToListItem(i);}},findItem:function(){if(D.system.phone||this._oApplicationProperties.getProperty("/productId")){return;}var I=this._oList.getItems();if(I.length>0){var o=null,p=this._oApplicationProperties.getProperty("/preferredIds");for(var i=0;!o&&i<p.length;i++){o=this._getListItemForId(p[i]);}o=o||this._getFirstRealItem();this._navToListItem(o);}else{this._oApplicationController.navToEmptyPage(this._oApplicationProperties.getProperty("/listNoDataText"),true);}this._oApplicationProperties.setProperty("/preferredIds",[]);},prepareForDelete:function(c){var p=[];if(c){var F=false,l=this._oList.getItems(),t=[];for(var i=0;i<l.length;i++){var I=l[i];if(!(I instanceof G)){var o=I.getBindingContext(),s=o.getProperty("Id");F=F||s===c;(F?p:t).push(s);}}if(F){t.reverse();p=p.concat(t);}}this._oApplicationProperties.setProperty("/preferredIds",p);},_getListBinding:function(){return this._oList.getBinding("items");},onSearch:function(e){var s=e.getSource(),c=s.getValue(),n=e.getParameter("refreshButtonPressed")?this._sCurrentSearchTerm:c;this._explicitRefresh(n);},_explicitRefresh:function(n,N){var m=function(){if(n===this._sCurrentSearchTerm){this.listRefresh();}else{this._sCurrentSearchTerm=n;this._oTableOperations.setSearchTerm(n);this.applyTableOperations();}}.bind(this);this._oApplicationController.whenMetadataLoaded(m,N);},onPullToRefresh:function(e){var p=e.getSource(),h=function(){p.hide();};this._oList.attachEventOnce("updateFinished",h);this._explicitRefresh(this._sCurrentSearchTerm,h);},onSortPressed:function(){this._oSubControllerForFGS.openDialog("ProductSortDialog","Name");},onFilterPressed:function(){this._oSubControllerForFGS.openDialog("ProductFilterDialog");},onGroupPressed:function(){this._oSubControllerForFGS.openDialog("ProductGroupingDialog");},onAddPressed:function(){var p=function(P){this._oApplicationProperties.setProperty("/isDirty",false);this._oApplicationController.navToProductEditPage(P.Id);this._removeAllSelections();this._oApplicationController.hideMasterInPortrait();}.bind(this);this._oHelper.createProductDraft(p);},onDeletePressed:function(){var c=this._oList.getSelectedContexts(true),p=[];jQuery.each(c,function(i,o){p.push(o.getPath());});var a=function(){this._removeAllSelections();}.bind(this);this._oHelper.deleteProducts(p,a);},onMultiSelectPressed:function(){var w=this._isListInMultiSelectMode();this._setMultiSelect(!w);},_setMultiSelect:function(m){if(m===this._isListInMultiSelectMode()){return;}this._oApplicationProperties.setProperty("/isMultiSelect",m);this._removeAllSelections();if(!m&&!D.system.phone){var s=this._getListItemForId(this._oApplicationProperties.getProperty("/productId"));this._setItemSelected(s);}},_isListInMultiSelectMode:function(){return this._oList.getMode()===L.MultiSelect;},_removeAllSelections:function(){this._oList.removeSelections(true);this._iMarkedCount=0;this._oViewProperties.setProperty("/markExists",false);},onNavButtonPress:function(){this._oApplicationController.navBack(false);},onSwipe:function(e){if(this._isListInMultiSelectMode()||this._isInEditMode()){e.preventDefault();}},onSwipeDeleteItem:function(){var b=this._oList.getSwipedItem().getBindingContext();this._oHelper.deleteProduct(b.getPath(),null,true);this._oList.swipeOut();},onItemSelect:function(e){var l=this._oList.getMode()===L.None?e.getSource():e.getParameter("listItem");var m=this._isListInMultiSelectMode();if(m){if(e.getParameter("selected")){this._iMarkedCount++;if(!D.system.phone){this._navToListItem(l);}}else{this._iMarkedCount--;}this._oViewProperties.setProperty("/markExists",this._iMarkedCount>0);}else{if(this._isInEditMode()){var a=function(){this._setItemSelected(this._getListItemForId(this._oApplicationProperties.getProperty("/productId")));};this._leaveEditPage(this._navToListItem.bind(this,l),a.bind(this));}else{this._navToListItem(l);}this._oApplicationController.hideMasterInPortrait();}},_navToListItem:function(l){var c=l.getBindingContext(),p=c.getProperty("Id");this._oApplicationController.showProductDetailPage(p);},_setItemSelected:function(i){if(i){this._oList.setSelectedItem(i);}else{this._removeAllSelections();}},_getListItemForId:function(I){if(!I||I==="-"){return null;}var a=this._oList.getItems();for(var i=0;i<a.length;i++){var o=a[i];if(!(o instanceof G)){var c=o.getBindingContext();if(c&&c.getProperty("Id")===I){return o;}}}},_scrollToListItem:function(l){if(!l||l===this._getFirstRealItem()){var p=this.byId("masterPage");p.scrollTo(0);}else{var d=l.getDomRef();if(d){d.scrollIntoView();}}},_isInEditMode:function(){return!this._oApplicationProperties.getProperty("/noEditMode");},_leaveEditPage:function(l,a){var p=this._oHelper.getPathForDraftId(this._oApplicationProperties.getProperty("/productId"));this._oHelper.deleteProductDraft(p,l,a);},_getFirstRealItem:function(){var I=this._oList.getItems();for(var i=0;i<I.length;i++){if(!(I[i]instanceof G)){return I[i];}}}});});