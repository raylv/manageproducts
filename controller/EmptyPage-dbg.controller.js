/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("nw.epm.refapps.ext.prod.manage.controller.EmptyPage", {
		// Handler for the nav button of the page. It is attached declaratively. Note that it is only available on phone.
		onNavButtonPress: function() {
			var oApplicationProperties = this.getView().getModel("appProperties");
			var oApplicationController = oApplicationProperties.getProperty("/applicationController");
			oApplicationController.navBack(true);
		}
	});
});