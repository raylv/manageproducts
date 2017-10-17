/*
 * Copyright (C) 2009-2016 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/Device"],function(D){"use strict";var c=D.support.touch?"sapUiSizeCozy":"sapUiSizeCompact";return{getContentDensityClass:function(){return c;},attachControlToView:function(v,C){jQuery.sap.syncStyleClass(c,v,C);v.addDependent(C);}};});
