/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","./utilities","nw/epm/refapps/ext/prod/manage/model/formatter"],function(O,u,f){"use strict";return O.extend("nw.epm.refapps.ext.prod.manage.controller.SubControllerForShare",{formatter:f,constructor:function(p,r){this._oParentView=p;this._oResourceBundle=r;},openDialog:function(e){var s=e.getSource();this._oProduct=this._oParentView.getBindingContext().getObject();if(!this._oShareDialog){this._oShareDialog=sap.ui.xmlfragment(this._oParentView.getId(),"nw.epm.refapps.ext.prod.manage.view.ShareSheet",this);u.attachControlToView(this._oParentView,this._oShareDialog);}this._oShareDialog.openBy(s);},onEmailPressed:function(){this._triggerEmail();},_triggerEmail:function(){sap.m.URLHelper.triggerEmail(null,this._getEmailSubject(),this._getEmailContent());},_getEmailSubject:function(){return this._oResourceBundle.getText("xtit.emailSubject",[this._oProduct.Name]);},_getEmailContent:function(){return this._oResourceBundle.getText("xtit.emailContent",[this._oProduct.Id,this._oProduct.Description,this._oProduct.SupplierName]);}});});