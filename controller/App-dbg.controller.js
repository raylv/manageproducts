/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
// Controller for the view hosting the (Split-)App.
sap.ui.define(["./utilities"], function(utilities) {
	"use strict";

	return sap.ui.controller("nw.epm.refapps.ext.prod.manage.controller.App", {
		onInit: function() {
			this.getView().addStyleClass(utilities.getContentDensityClass());
			this._oAppControl = this.byId("fioriContent");
		},

		hideMaster: function() {
			this._oAppControl.hideMaster();
		}
	});
});