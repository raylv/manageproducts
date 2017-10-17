/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller"],function(C){"use strict";return C.extend("nw.epm.refapps.ext.prod.manage.controller.EmptyPage",{onNavButtonPress:function(){var a=this.getView().getModel("appProperties");var A=a.getProperty("/applicationController");A.navBack(true);}});});
