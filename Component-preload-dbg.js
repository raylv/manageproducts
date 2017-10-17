jQuery.sap.registerPreloadedModules({
"name":"Component-preload",
"version":"2.0",
"modules":{
	"nw/epm/refapps/ext/prod/manage/Component.js":function(){sap.ui.define([
		"sap/ui/core/UIComponent",
		"./controller/Application",
		"./model/models",
		"sap/ui/Device"
	], function(UIComponent, Application, models, Device) {
	"use strict";

	var mRoutenames = {
		MASTER: "Products",
		DETAIL: "ProductDetails"
	};

	return UIComponent.extend("nw.epm.refapps.ext.prod.manage.Component", {
		metadata: {
			name: "xtit.shellTitle",
			version: "${project.version}",
			includes: ["css/manageProductStyle.css"],
			dependencies: {
				libs: ["sap.m", "sap.ushell"],
				components: []
			},
			rootView: "nw.epm.refapps.ext.prod.manage.view.App",
			config: {
				resourceBundle: "i18n/i18n.properties",
				titleResource: "xtit.shellTitle",
				icon: "sap-icon://Fiori7/F1373",
				favIcon: "icon/F0865_Manage_Products.ico",
				phone: "icon/launchicon/57_iPhone_Desktop_Launch.png",
				"phone@2": "icon/launchicon/114_iPhone-Retina_Web_Clip.png",
				tablet: "icon/launchicon/72_iPad_Desktop_Launch.png",
				"tablet@2": "icon/launchicon/144_iPad_Retina_Web_Clip.png",
				serviceConfig: {
					name: "EPM_REF_APPS_PROD_MAN_SRV",
					serviceUrl: "/sap/opu/odata/sap/EPM_REF_APPS_PROD_MAN_SRV"
				}
			},

			routing: {
				config: {
					routerClass: "sap.m.routing.Router",
					viewType: "XML",
					viewPath: "nw.epm.refapps.ext.prod.manage.view", // common prefix
					controlId: "fioriContent",
					bypassed: {
						target: ["master", "empty"]
					}
				},
				routes: [
					{
						pattern: "",
						name: mRoutenames.MASTER,
						target: ["object", "master"]
					},
					{
						pattern: "Product/{productID}",
						name: mRoutenames.DETAIL,
						target: ["master", "object"]
					}
				],
				targets: {
					master: {
						viewName: "S2_ProductMaster",
						viewLevel: 1,
						controlAggregation: "masterPages"
					},
					object: {
						viewName: "S3_ProductDetail",
						viewLevel: 2,
						controlAggregation: "detailPages"
					},
					empty: {
						viewName: "EmptyPage",
						viewLevel: 3,
						controlAggregation: "detailPages"
					}
				}
			}
		},

		init: function() {
			var mConfig = this.getMetadata().getConfig();

			// create and set the ODataModel
			var oModel = models.createODataModel({
				urlParametersForEveryRequest: [
						"sap-server",
						"sap-client",
						"sap-language"
					],
				url: this.getMetadata().getConfig().serviceConfig.serviceUrl,
				config: {
					metadataUrlParams: {
						"sap-documentation": "heading"
					},
					json: true,
					defaultBindingMode: "TwoWay",
					useBatch: true,
					defaultCountMode: "Inline",
					loadMetadataAsync: true
				}
			});

			// Note: Batch groups must be defined globally. Therefore, we do it here, although they are only used in the edit view.
			oModel.setDeferredBatchGroups(["editproduct", "BatchDelete"]);
			oModel.setChangeBatchGroups({
				"ProductDraft": {
					batchGroupId: "editproduct"
				}
			});

			this.setModel(oModel);
			// set the i18n model

			// always use absolute paths relative to our own component
			// (relative paths will fail if running in the Fiori Launchpad)
			var sRootPath = jQuery.sap.getModulePath("nw.epm.refapps.ext.prod.manage");

			// set i18n model
			this.setModel(models.createResourceModel(sRootPath, mConfig.resourceBundle), "i18n");

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			this._oApplicationController = new Application(this, mRoutenames);
			this._oApplicationController.init(this.getMetadata().getConfig().serviceConfig.serviceUrl);

			// create the views based on the url/hash
			this.getRouter().initialize();
		},

		/**
		 * The component is destroyed by UI5 automatically.
		 * In this method, the ErrorHandler are destroyed.
		 * @public
		 * @override
		 */
		destroy: function() {
			this.getModel().destroy();
			this.getModel("i18n").destroy();
			this.getModel("device").destroy();

			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		}
	});

});
},
	"nw/epm/refapps/ext/prod/manage/control/RatingAndCount.js":function(){sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/RatingIndicator",
	"sap/m/Label"
], function(Control, RatingIndicator, Label) {
	"use strict";

	return Control.extend("nw.epm.refapps.ext.prod.manage.control.RatingAndCount", {

		// The rating indicator and the rating count are combined in one control in order to be able to put
		// them in one table column instead of having to let them occupy one column each.

		// API:
		metadata: {
			properties: {
				"maxRatingValue": "int",
				"value": "float",
				"enabled": "boolean",
				"iconSize": "sap.ui.core.CSSSize",
				"ratingCount": "float",
				"verticalAlignContent": "boolean",
				"verticalAdjustment": "int"
			},
			events: {
				"press": {}
			},
			aggregations: {
				"_ratingCountLabel": {
					type: "sap.m.Label",
					multiple: false,
					visibility: "hidden"
				},
				"_ratingIndicator": {
					type: "sap.m.RatingIndicator",
					multiple: false,
					visibility: "hidden"
				}
			}
		},

		init: function() {
			this._oRating = new RatingIndicator(this.getId() + "-rating");
			this._oRating.setEnabled(false);
			this.setAggregation("_ratingIndicator", this._oRating, true);
			this._oRatingCountLabel = new Label(this.getId() + "-ratingCountLabel");
			this._oRatingCountLabel.addStyleClass("noColonLabelInForm");
			this.setAggregation("_ratingCountLabel", this._oRatingCountLabel, true);
		},

		// Overwriting the setter method is done in order to hand down the values to the
		// inner control in this. The setter method is used by the binding to update the
		// controls value.
		setValue: function(sValue) {
			var fvalue = parseFloat(sValue);
			this._oRating.setValue(fvalue);
			return this.setProperty("value", fvalue, true);
		},

		// Overwriting the setter method is done in order to hand down the values to the
		// inner control in this. The setter method is used by the binding to update the
		// controls value.
		setMaxRatingValue: function(sMaxRatingValue) {
			this._oRating.setMaxValue(sMaxRatingValue);
			return this.setProperty("maxRatingValue", sMaxRatingValue, true);
		},

		// Overwriting the setter method is done in order to hand down the values to the
		// inner control in this. The setter method is used by the binding to update the
		// controls value.
		setIconSize: function(sIconSize) {
			this._oRating.setIconSize(sIconSize);
			return this.setProperty("iconSize", sIconSize, true);
		},

		// Overwriting the setter method is done in order to hand down the values to the
		// inner control. The setter method is used by the binding to update the
		// controls value.
		// Note that in this case potentially two controls may be affected.
		setRatingCount: function(sRatingCount) {
			if (sRatingCount === undefined || sRatingCount === null) {
				sRatingCount = 0;
			}
			this._oRatingCountLabel.setVisible(sRatingCount !== null); // supress display of string null
			this._oRatingCountLabel.setText("(" + sRatingCount + ")");
			return this.setProperty("ratingCount", sRatingCount, true);
		},

		renderer: function(oRm, oControl) {
			var oRatingCount = oControl.getAggregation("_ratingCountLabel");
			if (oControl.getVerticalAdjustment() && oControl.getVerticalAdjustment() !== 0) {
				oRm.addStyle("-ms-transform", "translateY(" + oControl.getVerticalAdjustment() + "%)");
				oRm.addStyle("-webkit-transform", "translateY(" + oControl.getVerticalAdjustment() + "%)");
				oRm.addStyle("transform", "translateY(" + oControl.getVerticalAdjustment() + "%)");
			}
			if (oControl.getVerticalAlignContent()) {
				oRm.addStyle("line-height", oControl.getIconSize());
				oRatingCount.addStyleClass("nwEpmRefappsExtProdManageRatingAndCountVAlign");
			}

			oRm.write("<div");
			oRm.writeControlData(oControl); // write the Control ID and enable event
			// handling
			oRm.writeStyles();
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oControl.getAggregation("_ratingIndicator"));
			oRm.renderControl(oRatingCount);
			oRm.write("</div>");
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/App.controller.js":function(){// Controller for the view hosting the (Split-)App.
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
},
	"nw/epm/refapps/ext/prod/manage/controller/Application.js":function(){sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/odata/v2/ODataModel",
	"./NavigationManager",
	"./messages",
	"./utilities",
	"nw/epm/refapps/ext/prod/manage/model/Products",
	"nw/epm/refapps/ext/prod/manage/model/formatter"
], function(Object, Device, JSONModel, ODataModel, NavigationManager, messages, utilities, Products, formatter) {
	"use strict";

	function fnInitBusyHandling(oApplicationProperties) {
		// This function is called in the initialization phase. It ensures that the busy state of the app is set correctly.
		// oApplicationProperties is the global application model (see below). This model contains a property isAppBusy
		// which is declaratively bound to the busy state of the app (see view nw.epm.refapps.ext.prod.manage.view.App).
		// Actually there are several reasons which make the app busy. All of them can be expressed via properties handled
		// by the global application model. E.g. the app should be busy when isBusyDeleting is true.
		// Therefore, in this function we register for changes of any of those properties influencing the busy state.   
		var mBusyReasons = { // A map of the global properties influencing the busy state onto the value which makes the app busy
				isBusyDeleting: true,
				isBusyCreatingDraft: true,
				isBusySaving: true,
				metaDataLoadState: 0,
				lostDraftReadState: 0
			},
			fnRefreshBusyState = function() { // function which is called when a property influencing the busy state is modified
				var bIsBusy = false; // information whether app should be busy now. First assumption: app is not busy
				for (var sProp in mBusyReasons) { // check whether we find any reason for being busy
					var vExpected = mBusyReasons[sProp];
					var vValue = oApplicationProperties.getProperty("/" + sProp);
					if (vExpected === vValue) { // ok, the app is busy
						bIsBusy = true;
						// We set the app to busy now. When this busy state ends we will still
						// have to re determine the detail area. Since we want to avoid
						// a flickering of busy indicators we ensure that the busy indicator
						// of the detail area becomes busy immediately.
						oApplicationProperties.setProperty("/detailBusyIndicatorDelay", 0);
						break;
					}
				}
				oApplicationProperties.setProperty("/isAppBusy", bIsBusy);
			};
		// Now register fnRefrechBusyState to changes of all properties contained in mBusyReasons
		for (var sProperty in mBusyReasons) {
			var oBinding = oApplicationProperties.bindProperty("/" + sProperty);
			oBinding.attachChange(fnRefreshBusyState);
		}
	}

	return Object.extend("nw.epm.refapps.ext.prod.manage.controller.Application", {
		// This class serves as controller for the whole App. It is a singleton object which is initialized by the Component.
		// Since the Component exposes a reference to this singleton object all controllers have access to it and can use its public methods.
		// On the other hand the S2 and the S3 view register at this singelton on startup, such that it can call public methods of these controllers
		// if necessary.

		// --- the following attributes are initialized during startup and not changed afterwards
		// _oComponent: the Component (nw.epm.refapps.ext.prod.manage.Component)
		// _mRoutes: Access the routenames (see Component)
		// _oResourceBundle: the resource bundle used by this app
		// _oModel: the OData model used by this App
		// _oApplicationProperties: a JSON model used to share global state between the classes used in this App
		// it possesses the following attributes:
		// applicationController - this instance
		// serviceUrl            - the url of the OData service used by this app
		// isMultiSelect         - is the App in multi select mode
		// metaDataLoadState     - 0: meta data loading, 1: meta data loading was successful, -1 metadata loading failed
		// lostDraftReadState    - 0: reading lost draft, 1: lost draft info read successfully, -1 none of them
		// isBusyDeleting, isBusyCreatingDraft, isBusySaving
		//                       - busy states of the app
		// isAppBusy             - information whether the app as a whole is busy. Its state is dervied from
		//                         other states (see fnInitBusyHandling)
		// detailBusyIndicatorDelay, masterBusyIndicatorDelay
		//                       - busy delays for master and detail view. They are either 0 (no delay) or null (default delay)
		// noEditMode            - is the App in display mode,
		// productId             - if this attribute is truthy it contains the id of the product to be displayed currently
		// preferredIds          - this attribute is only evaluated when productId is faulty. In this case it contains an
		//                         array of product ids. The first of these ids corresponding to an item in the master list
		//                         will be displayed
		// isDirty               - flag indicating whether the current draft is dirty. Only relevant in edit scenarios.
		// lastDisplay           - id of the last product that was shown in display screen
		// isListLoading         - information whether the master list is currently loading
		// listNoDataText        - the noDataText currently applicable for the master list
		// emptyText             - text to be shown on the empty page
		// _oNavigationManager: instance of nw.epm.refapps.ext.prod.manage.controller.NavigationManager responsible for handling navigation
		// _oDataHelper: instance of nw.epm.refapps.ext.prod.manage.model.Products used to perform explicit backend calls
		// _oMasterController: controller of nw.epm.refapps.ext.prod.manage.view.S2_ProductMaster
		// _oOnMetaData: an instance which possesses arrays onSuccess and onFailure as members. The elements of these arrays are functions, 
		// which will be executed according to whether the loading of the metadata was successful or failure.
		// As soon as the metadata have been loaded successfully the attribute will not be used anymore (and thus set to null).

		// --- Lifecycle methods

		// - Methods called during application startup. Note that the methods will be called in the following
		//   order: constructor, init, registerMaster, onRoutePatternMatched (of NavigationManager), onMetadataLoaded.
		//   The point in time when registerDetail is called depends on the route which is used to start the App.

		constructor: function(oComponent, mRoutes) {
			this._oComponent = oComponent;
			this._mRoutes = mRoutes;
		},

		init: function(sServiceUrl) {
			this._oMainView = this._oComponent.getAggregation("rootControl");

			this._oOnMetaData = {
				onSuccess: [],
				onFailure: []
			};
			var oODataModel = this._oComponent.getModel();
			oODataModel.attachMetadataLoaded(this.onMetadataLoaded, this);
			oODataModel.attachMetadataFailed(this.onMetadataFailed, this);

			this._oApplicationProperties = new JSONModel({
				serviceUrl: sServiceUrl,
				metaDataLoadState: 0,
				lostDraftReadState: -1,
				isBusyDeleting: false,
				isBusyCreatingDraft: false,
				isBusySaving: false,
				isAppBusy: true,
				detailBusyIndicatorDelay: 0,
				masterBusyIndicatorDelay: 0,
				applicationController: this,
				isMultiSelect: false,
				noEditMode: true,
				preferredIds: [],
				isDirty: false,
				lastDisplay: null,
				isListLoading: false,
				listNoDataText: " "
			});
			this._oComponent.setModel(this._oApplicationProperties, "appProperties");
			fnInitBusyHandling(this._oApplicationProperties);
			this._oDataHelper = new Products(this._oComponent, this._oMainView);

			var oRouter = this._oComponent.getRouter();
			this._oNavigationManager = new NavigationManager(oRouter, this._oApplicationProperties, this._mRoutes, this._oComponent.getModel(
				"i18n").getResourceBundle());
			this._oNavigationManager.init();
			this._extractStartupParameters(oRouter);
		},

		_extractStartupParameters: function(oRouter) {
			// handle the case that App was reached via Cross App navigation
			var oComponentData = this._oComponent.getComponentData();
			if (oComponentData && oComponentData.startupParameters && jQuery.isArray(oComponentData.startupParameters.Product) &&
				oComponentData.startupParameters.Product.length > 0) {
				var sUrl = oRouter.getURL(this._mRoutes.DETAIL, {
					productID: oComponentData.startupParameters.Product[0]
				});
				if (sUrl) {
					sap.ui.require(["sap/ui/core/routing/HashChanger"], function(HashChanger) {
						var oHashChanger = HashChanger.getInstance();
						oHashChanger.replaceHash(sUrl);
					});
				}
			}
		},

		registerMaster: function(oMasterController) {
			// This method is called in onInit() of the S2-view
			this._oMasterController = oMasterController;
			this._oNavigationManager.registerMaster(oMasterController);
		},

		registerDetail: function(oDetailController) {
			// This method is called in onInit() of the S3-view
			this._oNavigationManager.registerDetail(oDetailController);
		},

		onMetadataLoaded: function() {
			// In normal scenarios this method is called at the end of the startup process. However, in cases that initial loading of
			// metadata fails, this method may be called later. It is registered in init().
			this._checkForLostDraft();
			this._oApplicationProperties.setProperty("/metaDataLoadState", 1);
			this._oApplicationProperties.setProperty("/isListLoading", true);
			for (var i = 0; i < this._oOnMetaData.onSuccess.length; i++) {
				this._oOnMetaData.onSuccess[i]();
			}
			this._oOnMetaData = null;
		},

		onMetadataFailed: function() {
			this._oApplicationProperties.setProperty("/metaDataLoadState", -1);
			for (var i = 0; i < this._oOnMetaData.onFailure.length; i++) {
				this._oOnMetaData.onFailure[i]();
			}
			this._oOnMetaData = {
				onSuccess: [],
				onFailure: []
			};
		},

		// - Navigation methods are forwarded to the NavigationManager

		navBackToMasterPageInPhone: function() {
			return this._oNavigationManager.navBackToMasterPageInPhone();
		},

		showProductDetailPage: function(sProductId, bListRefresh) {
			// This method navigates to the display page for the specified product id. Note that this method must only
			// be called when either no draft exists (for the current user), or the deletion of this draft has been triggered already,
			// or the lookup for lost draft has failed.
			this._oNavigationManager.showProductDetailPage(sProductId, bListRefresh);
		},

		navToMaster: function(sPrefereredId) {
			// This method navigates to the master route. sPreferredId is an optional parameter that may contain the id of a
			// product that (on non-phone devices) is preferably shown (provided it is in the master list). Prerequisites for
			// calling this method are as for showProductDetailPage.
			this._oNavigationManager.navToMaster(sPrefereredId);
		},

		navToProductEditPage: function(sDraftId) {
			// This method navigates to the edit page for the (only existing) draft for this user. Note that this method must only
			// be called when this draft exists and its id is either passed as parameter sDraftId or is already contained in attribute
			// productId of the AppModel.
			this._oNavigationManager.navToProductEditPage(sDraftId);
		},

		navToEmptyPage: function(sText, bResetUrl) {
			// This method navigates to the empty page in detail area. Prerequisites for
			// calling this method are as for showProductDetailPage.
			// sText is the text to be shown on the empty page
			this._oNavigationManager.navToEmptyPage(sText, bResetUrl);
		},

		navBack: function(bFromDetail) {
			this._oNavigationManager.navBack(bFromDetail, this._oDataHelper);
		},

		// --- Methods dealing with lost drafts

		_checkForLostDraft: function() {
			// This method triggers the check for a lost draft. It is called directly after the metadata have been loaded.
			// If the backend call fails, this method will be called on every list refresh until it succeeds the first time.
			// Note that performing this logic in onMetaDataLoaded has two advantages:
			// - the types of the oData response for the lost draft are set correctly
			// - the call will implicitly be batched with the first call to determine the master list
			this._oApplicationProperties.setProperty("/lostDraftReadState", 0);
			var fnError = function(oResponse) {
				this._oApplicationProperties.setProperty("/lostDraftReadState", -1);
				messages.showErrorMessage(oResponse, this._oMainView);
			};
			// delegate oData call to the helper object
			this._oDataHelper.readProductDraft(this.handleLostDraft.bind(this), fnError.bind(this));
		},

		handleLostDraft: function(sDraftId, oProductDraft) {
			// This method will be called when we have successfully retrieved the information on lost drafts.
			// If a lost draft exists its id is passed in parameter sDraftId and the full object is passed in oProductDraft.
			// Otherwise both parameters are faulty.
			// Note that onRoutePatdaternMatched has been executed at this point in time.
			this._oApplicationProperties.setProperty("/lostDraftReadState", 1);
			if (sDraftId) { // a lost draft exists
				var sLastId = this._oApplicationProperties.getProperty("/productId"); // store the id of the product currently displayed (if there is one)
				if (sLastId !== sDraftId && !oProductDraft.IsDirty) { // if the lost draft is not dirty and it is not the current one
					this._oDataHelper.deleteDraft(sDraftId); // delete it without notice
					return;
				}
				this.navToProductEditPage(sDraftId); // the lost draft is either dirty or belonging to the product currently displayed -> go to its edit page
				if (sLastId === sDraftId) { // if the user was working on this product anyway we are done
					this._oApplicationProperties.setProperty("/isDirty", oProductDraft.IsDirty); // but update the global isDirty-property first
					return;
				}
				// User has a lost (dirty) draft belonging to another object than he is currently looking at.
				// -> he must either edit this draft or revert it
				var oDialog,
					fnDiscarded = function() { // this method is called when the user decides to revert the draft
						oDialog.close();
						this._oDataHelper.deleteDraft(sDraftId); // delete the draft
						if (sLastId) { // preferably go back to the product we were working on before
							this.showProductDetailPage(sLastId);
						} else { // Otherwise we prefer to display the product we had in edit screen, if possible
							this.navToMaster(!oProductDraft.IsNew && sDraftId);
						}
					}.bind(this),
					fnResumed = function() {
						this._oApplicationProperties.setProperty("/isDirty", true); // the draft is already dirty
						oDialog.close(); // when the user wants to resume the draft, we are already on the right screen
					}.bind(this);

				oDialog = sap.ui.xmlfragment("nw.epm.refapps.ext.prod.manage.view.LostDraftDialog", {
					oResourceBundle: this._oComponent.getModel("i18n").getResourceBundle(),
					formatter: formatter,
					onDiscard: fnDiscarded,
					onResume: fnResumed
				});
				utilities.attachControlToView(this._oMainView, oDialog);
				var oDraftModel = new JSONModel({
					productDraft: oProductDraft
				});
				oDialog.setModel(oDraftModel, "draft");
				oDialog.open();
			}
		},

		// --- Methods dealing with deletion of products

		deleteListener: function(bBeforeDelete, aPaths) {
			// This function deals with deleting of products.
			// It must be called twice for every delete operations performed on products (not for other entities like product drafts).
			// The first time it is called is before the delete operation is performed.
			// The second time is, after the delete operation has been performed successfully (at least partially)
			// -bBeforeDelete denotes the information which case applies
			// -aPaths is the array of product ids to be deleted
			if (bBeforeDelete) {
				this._beforeDelete(aPaths);
			} else {
				this._afterDelete();
			}
		},

		_beforeDelete: function(aPaths) {
			// called immediately before products are deleted.
			// The task of this method is to predefine the object which should be displayed after the deletion process.
			// This is done by setting the attributes productId and preferredIds ain the AppModel.
			// Thereby, the logic is as follows: If the item that is currently displayed is not to be deleted it should stay the the seletced one.
			// Otherwise, we build a list of preferred entries. Thereby, we prefer to take the list items being currently behind the current item.
			// As a second preference we take those items in front of the present one (starting with the last).
			// Note that we also consider items which shall be deleted, as the deletion may fail partially.
			var sCurrentId = !Device.system.phone && this._oApplicationProperties.getProperty("/productId");
			this._oApplicationProperties.setProperty("/productId", null);
			if (sCurrentId) {
				var bCurrentWillBeDeleted = false,
					sCurrentPath = this._oDataHelper.getPathForProductId(sCurrentId);
				for (var i = 0; !bCurrentWillBeDeleted && i < aPaths.length; i++) {
					bCurrentWillBeDeleted = sCurrentPath === aPaths[i];
				}
				if (!bCurrentWillBeDeleted) {
					this._oApplicationProperties.setProperty("/productId", sCurrentId);
					return;
				}
			}
			if (this._oMasterController) {
				this._oMasterController.prepareForDelete(sCurrentId);
			}
		},

		// Called immediately after a successfull deletion of products has taken place.
		_afterDelete: function() {
			this.navBackToMasterPageInPhone();
			if (!this._oApplicationProperties.getProperty("/isListLoading")) {
				this._oMasterController.findItem();
			}
		},

		// --- Methods to be called by the controllers

		getODataHelper: function() {
			// Returns the (singleton) helper for handling oData operations in this application
			return this._oDataHelper;
		},

		// This method can be called when another action depends on the fact that the metadata have been loaded successfully.
		// More precisely the contract of this method is as follows:
		// - when the metadata have already been loaded successfully fnMetadataLoaded is executed immediately.
		//   Moreover in this case the check for lost draft would be triggered once more if it has failed before
		// - In case the metadata have not yet been loaded successfully, it is once more tried to load the metadata.
		//   fnMetadataLoaded will be called when the metadata have been loaded succesfully, whereas fnNoMetadata will
		//   be called when the metadata loading has failed.
		// - When the method is called while the metadata are still loading, fnMetaDataLoaded and fnNoMetadata will override
		//   functions which jhave been provided by previous calls. However, this cannot happen, since the App is busy
		//   while metadata are loading.
		whenMetadataLoaded: function(fnMetadataLoaded, fnNoMetadata) {
			var iMetadataLoadState = this._oApplicationProperties.getProperty("/metaDataLoadState");
			if (iMetadataLoadState === 1) {
				if (fnMetadataLoaded) {
					fnMetadataLoaded();
				}
				if (this._oApplicationProperties.getProperty("/lostDraftReadState") < 0) {
					this._checkForLostDraft();
				}
			} else {
				if (fnMetadataLoaded) {
					this._oOnMetaData.onSuccess.push(fnMetadataLoaded);
				}
				if (fnNoMetadata) {
					this._oOnMetaData.onFailure.push(fnNoMetadata);
				}
				if (iMetadataLoadState === -1) {
					this._oApplicationProperties.setProperty("/metaDataLoadState", 0);
					this._oComponent.getModel().refreshMetadata();
				}
			}
		},

		// This method is only important in portrait mode on a tablet. There it hides the master list.
		hideMasterInPortrait: function() {
			this._oMainView.getController().hideMaster();
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/EmptyPage.controller.js":function(){sap.ui.define([
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
},
	"nw/epm/refapps/ext/prod/manage/controller/NavigationManager.js":function(){sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/Device",
	"sap/ui/core/routing/History"
], function(Object, Device, History) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.prod.manage.controller.NavigationManager", {
		// _oRouter: The router of this app
		// _oApplicationProperties: global state model of the App
		// _mRoutes: The routes used by this app
		// _oResourceBundle: The resource bundle used by this app
		// _oMasterController, _oDetailController: Controllers of S2 and S3 view
		// _bSubControllersMustBeAdapted: this attribute is used to distinguish between hash changes performed
		// programmatically (via method _executeNavigation) and hash changes performed by the user.
		// For changes performed programmatically the detail controller has already been updated beforehand.
		// Therefore, onRoutePatternMatched needs not to care for this.

		constructor: function(oRouter, oApplicationProperties, mRoutes, oResourceBundle) {
			this._oRouter = oRouter;
			this._oApplicationProperties = oApplicationProperties;
			this._mRoutes = mRoutes;
			this._oResourceBundle = oResourceBundle;
		},

		init: function() {
			this._bSubControllersMustBeAdapted = true;
			this._oRouter.getTargetHandler().setCloseDialogs(false);
			this._oRouter.attachRoutePatternMatched(this.onRoutePatternMatched, this);
			this._oRouter.attachBypassed(this.onBypassed, this);
			// Router is initialized at the end, since this triggers the instantiation of the views.
			// In onInit of the views we want to rely on the component being correctly initialized.
			this._oRouter.initialize();
		},

		registerMaster: function(oMasterController) {
			// This method is called in onInit() of the S2-view
			this._oMasterController = oMasterController;
		},

		registerDetail: function(oDetailController) {
			// This method is called in onInit() of the S3-view
			this._oDetailController = oDetailController;
		},
		// - Navigation methods

		onRoutePatternMatched: function(oEvent) {
			// This method is registered at the router. It will be called whenever the url-hash changes. Note that there may be two reasons
			// for this. The hash may be set by the browser (e.g. if the user follows a link leading to this App) or by the router itself.
			// The second case applies when the App calls a navigation method of the router itself.
			var sRoute = oEvent.getParameter("name"),
				sProductId = (sRoute === this._mRoutes.DETAIL) && decodeURIComponent(oEvent.getParameter("arguments").productID);
			this._oApplicationProperties.setProperty("/productId", sProductId);
			if (sProductId) {
				if (this._bSubControllersMustBeAdapted) {
					this._newProductId();
				}
				this._oMasterController.adaptToDetailSelection(this._bSubControllersMustBeAdapted);
			}
			this._bSubControllersMustBeAdapted = true;
		},

		// called for invalid url-hashes
		onBypassed: function() {
			this._oApplicationProperties.setProperty("/productId", "-");
			this._oApplicationProperties.setProperty("/emptyText", this._oResourceBundle.getText("ymsg.pageNotFound"));
			this._oMasterController.adaptToDetailSelection(false);
		},

		_newProductId: function() {
			// helper method, that informs detail controller that a new product id has been selected
			// Thereby, detail controller needs to check whether it has to change between display and edit mode.
			if (this._oDetailController && !this._oDetailController.editModeChanged()) {
				this._oDetailController.productChanged();
			}
		},

		navBackToMasterPageInPhone: function() {
			// Navigates back to the master page on phone, return true for the phone case, return false for other cases
			if (Device.system.phone) {
				this.navToMaster();
				return true;
			}
			return false;
		},

		showProductDetailPage: function(sProductId, bListRefresh) {
			// This method navigates to the display page for the specified product id. Note that this method must only
			// be called when either no draft exists (for the current user), or the deletion of this draft has been triggered already,
			// or the lookup for lost draft has failed.
			this._oApplicationProperties.setProperty("/productId", sProductId);
			this._changeEditMode(false);
			if (bListRefresh) {
				this._oMasterController.listRefresh();
			}
			this._oMasterController.adaptToDetailSelection();
			if (this._oDetailController) {
				this._oDetailController.productChanged();
			}
			this._executeNavigation(this._mRoutes.DETAIL, {
				productID: encodeURIComponent(sProductId)
			}, !Device.system.phone); // true: hash should not be stored in the history
		},

		navToMaster: function(sPrefereredId) {
			// This method navigates to the master route. sPreferredId is an optional parameter that may contain the id of a
			// product that (on non-phone devices) is preferably shown (provided it is in the master list). Prerequisites for
			// calling this method are as for showProductDetailPage.
			this._executeNavigation(this._mRoutes.MASTER, {}, true);
			this._oApplicationProperties.setProperty("/preferredIds", sPrefereredId ? [sPrefereredId] : []);
			this._oApplicationProperties.setProperty("/productId", null);
			this._changeEditMode(false);
			this._oMasterController.findItem();
		},

		navToProductEditPage: function(sDraftId) {
			// This method navigates to the edit page for the (only existing) draft for this user. Note that this method must only
			// be called when this draft exists and its id is either passed as parameter sDraftId or is already contained in attribute
			// productId of the AppModel.
			if (sDraftId) {
				this._oApplicationProperties.setProperty("/productId", sDraftId);
			} else {
				sDraftId = this._oApplicationProperties.getProperty("/productId");
			}
			this._changeEditMode(true);
			this._executeNavigation(this._mRoutes.DETAIL, {
				productID: encodeURIComponent(sDraftId)
			}, !Device.system.phone);
			this._oMasterController.adaptToDetailSelection();
		},

		_changeEditMode: function(bIsEdit) {
			// This method sets the edit mode of the App as specified by parameter bIsEdit
			if (this._oApplicationProperties.getProperty("/noEditMode") !== bIsEdit) {
				return;
			}
			this._oApplicationProperties.setProperty("/noEditMode", !bIsEdit);
			if (this._oDetailController) {
				this._oDetailController.editModeChanged();
			}
		},

		navToEmptyPage: function(sText, bResetUrl) {
			// This method navigates to the empty page in detail area. Prerequisites for
			// calling this method are as for showProductDetailPage.
			// sText is the text to be shown on the empty page
			// bResetUrl defines whether the route should be set back to the master route
			this._oApplicationProperties.setProperty("/emptyText", sText);
			if (bResetUrl) {
				// Set back the route to the generic one
				this._executeNavigation(this._mRoutes.MASTER);
			}
			this._oRouter.getTargets().display("empty");
		},

		navBack: function(bFromDetail, oDataHelper) {
			if (this._oApplicationProperties.getProperty("/noEditMode")) {
				this._navBackImpl(bFromDetail);
			} else {
				var sPath = oDataHelper.getPathForDraftId(this._oApplicationProperties.getProperty("/productId"));
				oDataHelper.deleteProductDraft(sPath, this._navBackImpl.bind(this, bFromDetail));
			}
		},

		_navBackImpl: function(bFromDetail) {
			var oHistory = History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();
			//The history contains a previous entry
			this._changeEditMode(false);
			if (typeof sPreviousHash !== "undefined") {
				history.go(-1);
			} else if (bFromDetail) {
				this.navToMaster();
			} else {
				// navigate back to FLP home
				var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				if (oCrossAppNavigator) {
					oCrossAppNavigator.toExternal({
						target: {
							shellHash: "#"
						}
					});
				}
			}
		},

		_executeNavigation: function(sName, oParameters, bReplace) {
			// This method wraps the navTo-method of the router. It is called for navigation performed programmatically.
			// Thus, we expect that the subcontrollers have already been informed. So _bSubControllersMustBeAdapted is
			// set to false which is evaluated in onRoutePatternMatched.
			// However, there is one exception: If the detail controller was not registered at this point in time, adapting
			// it had to be postponed.
			this._bSubControllersMustBeAdapted = !this._oDetailController;
			this._oRouter.navTo(sName, oParameters, bReplace);
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/ProductDisplay.controller.js":function(){// Note that this view is hosted by nw.epm.refapps.ext.prod.manage.view.S3_ProductDetail. Thus, it implements the lifecycle methods show and leave
// defined by this view.
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"./SubControllerForShare",
	"./messages",
	"./utilities",
	"nw/epm/refapps/ext/prod/manage/model/formatter"
], function(Controller, JSONModel, SubControllerForShare, messages, utilities, formatter) {
	"use strict";

	return Controller.extend("nw.epm.refapps.ext.prod.manage.controller.ProductDisplay", {
		formatter: formatter,
		// --- Helper attributes that are initialized during onInit and never changed afterwards

		// _oViewProperties: json model used to manipulate declarative attributes of the controls used in this view. Initialized in _initViewPropertiesModel.
		// Contains the attribute dataLoaded which is set to true, as soon as the product is loaded
		// _oView: this view
		// _oApplicationController: the controller of the App
		// _oApplicationProperties: json model containing the App state
		// _oResourceBundle: the resource bundle to retrieve texts from
		// _oHelper: singleton instance of nw.epm.refapps.ext.prod.manage.util.Products used to call backend services
		// _oSubControllerForShare: helper for the share dialog
		// _oShareDialog: dialog for the share button. Initialized on demand.

		// --- attributes describing the current state
		// _sContextPath: Stores the currently requested context path
		// _oProduct: product currently bound to the view, it could be null if the requested product cannot be found any more or we are in the process of loading it
		// _sOldId: Store last retrieved supplier id.  Needed in cases when supplier is shown in display mode, then new supplier in edit mode

		// --- Initialization

		onInit: function() {
			// Gets the application component and the data operation helper instance
			this._oView = this.getView();
			this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = this._oApplicationController.getODataHelper();
			this._oSubControllerForShare = new SubControllerForShare(this._oView, this._oResourceBundle);
			this._sContextPath = "";
			this._mSupplierDatas = {};
		},

		_initViewPropertiesModel: function() {
			// The model created here is used to set values or view element properties that cannot be bound
			// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the
			// alternative of getting each view element by its ID and setting the values directly because a JSon model is more
			// robust if the customer removes view elements (see extensibility).
			this._oViewProperties = new JSONModel({
				dataLoaded: false
			});
			this._oView.setModel(this._oViewProperties, "viewProperties");
		},

		// --- Lifecycle methods used by the hosting view

		show: function() {
			var sProductId = this._oApplicationProperties.getProperty("/productId");
			if (!sProductId) {
				return;
			}
			this._oApplicationController.whenMetadataLoaded(this._show.bind(this, sProductId));
		},

		// Note: This function must not be called before the metadata have been read successfully
		_show: function(sProductId) {
			this._sContextPath = this._oHelper.getPathForProductId(sProductId);
			this._oView.bindElement(this._sContextPath);

			// 1. Check whether data is already available locally in the model
			var bProductDataAlreadyRead = this._extractProduct();
			this._oViewProperties.setProperty("/dataLoaded", bProductDataAlreadyRead);
			// 2. If the binding is not set yet, register for the data for the binding are loaded asynchronously.
			if (!bProductDataAlreadyRead) {
				this._oView.getElementBinding().attachEventOnce("dataReceived", this._getBindingDataReceivedHandler(sProductId), this);
			}
		},

		_extractProduct: function() {
			// Helper function for reading the product from the binding context and making sure it is the requested one.
			// Return the information whether a binding context was available.
			var oBindingContext = this._oView.getBindingContext();
			this._oProduct = null;
			if (oBindingContext) {
				if (oBindingContext.getPath() === this._sContextPath) {
					this._oProduct = oBindingContext.getObject();
					this._oApplicationProperties.setProperty("/lastDisplay", this._oProduct.Id);
					this._oApplicationProperties.setProperty("/detailBusyIndicatorDelay", null);
					return true;
				}
			}
			return false; // The requested product is not available in backend
		},

		_getBindingDataReceivedHandler: function(sProductID) {
			return function() {
				if (sProductID !== this._oApplicationProperties.getProperty("/productId") || !this._oView.getElementBinding()) {
					return;
				}
				var bProductDataAlreadyRead = this._extractProduct();
				if (!bProductDataAlreadyRead) {
					// Handles the case that the product cannot be retrieved remotely (such as it was already deleted).
					var sText = this._oResourceBundle.getText("ymsg.productUnavailable", [sProductID]);
					this._oApplicationController.navToEmptyPage(sText);
				}
				this._oViewProperties.setProperty("/dataLoaded", true);
			};
		},

		leave: function() {
			this._oView.unbindElement();
		},

		// --- Event handlers attached declaratively
		// User wants to open the business card of the product supplier
		onSupplierPressed: function(oEvent) {
			if (!this._oSupplierCard) {
				this._initializeSupplierCard();
			}
			this._oSupplierCard.openBy(oEvent.getSource());
		},

		_initializeSupplierCard: function() {
			var oView = this.getView();
			this._oSupplierCard = sap.ui.xmlfragment(oView.getId(), "nw.epm.refapps.ext.prod.manage.view.SupplierCard");
			this._oSupplierCard.bindElement({
				path: "Supplier"
			});
			utilities.attachControlToView(oView, this._oSupplierCard);
		},

		onCopyPressed: function() {
			this._oHelper.copyProductToDraft(this._oApplicationProperties.getProperty("/productId"), this._oApplicationController.navToProductEditPage
				.bind(
					this._oApplicationController));
		},

		onEditPressed: function() {
			this._oHelper.getProductDraftFromProductId(this._oApplicationProperties.getProperty("/productId"), this._oApplicationController.navToProductEditPage
				.bind(this._oApplicationController));
		},

		onDeletePressed: function() {
			this._oHelper.deleteProduct(this._sContextPath);
		},

		onSharePressed: function(oEvent) {
			this._oSubControllerForShare.openDialog(oEvent);
		},

		onNavButtonPress: function() {
			// Handler for the nav button of the page. It is attached declaratively. Note that it is only available on phone
			this._oApplicationController.navBack(true);
			this._oView.unbindElement();
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/ProductDraftUploadImages.controller.js":function(){sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/UploadCollectionParameter",
	"nw/epm/refapps/ext/prod/manage/model/formatter",
	"nw/epm/refapps/ext/prod/manage/controller/messages"
], function(Controller, UploadCollectionParameter, formatter, messages) {
	"use strict";

	function fnMessageBoxAlert(sText) {
		sap.ui.require(["sap/m/MessageBox", "nw/epm/refapps/ext/prod/manage/controller/utilities"], function(MessageBox, utilities) {
			MessageBox.alert(sText, {
				styleClass: utilities.getContentDensityClass()
			});
		});
	}

	return Controller.extend("nw.epm.refapps.ext.prod.manage.controller.ProductDraftUploadImages", {
		formatter: formatter,
		// _oControlUploadImage
		// _oDataHelper
		// _oResourceBundle
		// _fnSetDraftDirty

		onInit: function() {
			this._oControlUploadImage = this.byId("Upload_Images");
		},

		// This handler is called if the file mismatches the given file type
		onFileTypeMismatch: function(oEvent) {
			var ofileType = oEvent.getParameters().getParameter("fileType");
			fnMessageBoxAlert(this._oResourceBundle.getText("ymsg.fileTypeMismatch", ofileType));
		},

		// This handler is called after the upload request is completed
		onUploadCompleted: function(oEvent) {
			var oResponse = oEvent.getParameters();
			// Status code 201: image is created/uploaded
			if (oResponse.getParameter("status") === 201) {
				this._fnSetDraftDirty();
			} else {
				var oError = oResponse.getParameter("responseRaw");
				messages.showXMLErrorMessage(oError, this.getView());
			}
			this._oControlUploadImage.getBinding("items").refresh();
		},

		// User chooses the Delete icon
		onImageDelete: function(oEvent) {
			var sImageId = oEvent.getParameters().documentId;
			var sPath = this.getView().getModel().createKey("/ImageDrafts", {
				Id: sImageId
			});
			this._oDataHelper.deleteImageDraft(sPath, function() {
				this._fnSetDraftDirty();
				this._oControlUploadImage.getBinding("items").refresh();
			}.bind(this));
		},

		// This Handler is called after the user selects the image to be uploaded and still before the image is sent
		// to the backend. For a successful file uploading, the security (XSRF) token needs to be provided for the Gateway,
		// currently it needs to set (or updated if the upload has been done once) manually by the application.
		// Note: the token is set usually automatically by the oDataModel for the native oData operations, such as CRUD and
		// function import operations.                         
		onChange: function() {
			// Gets the latest token form the oDataModel
			var fnSetSecurityTokenInHeader = function() {
				var sCSRFToken = this.getView().getModel().getSecurityToken(),
					bFound = false,
					aHeaderParameters = this._oControlUploadImage.getHeaderParameters();
				// Finds the HTTP request header with "x-csrf-token", if found, updates the value to the latest one.
				if (aHeaderParameters) {
					for (var i = 0; i < aHeaderParameters.length; i++) {
						if (aHeaderParameters[i].getName() === "x-csrf-token") {
							bFound = true;
							aHeaderParameters[i].setValue(sCSRFToken);
							break;
						}
					}
				}
				// If the HTTP request header with "x-csrf-token" has not yet been set, the corresponding new header has to
				// be included.
				if (!bFound) {
					this._oControlUploadImage.addHeaderParameter(new UploadCollectionParameter({
						name: "x-csrf-token",
						value: sCSRFToken
					}));
				}
			}.bind(this);
			this._whenSecurityToken(fnSetSecurityTokenInHeader);
		},

		// Sets the data provided by the parent controller
		setInitData: function(oSettings) {
			this._oDataHelper = oSettings.oDataHelper;
			this._fnSetDraftDirty = oSettings.fnDirty;
			this._oResourceBundle = oSettings.oResourceBundle;
		},

		// Gets the latest security token from the server and executes a given function afterwards
		_whenSecurityToken: function(fnWithSecurityToken) {
			this.getView().getModel().refreshSecurityToken(fnWithSecurityToken, function() {
				fnMessageBoxAlert(this._oResourceBundle.getText("ymsg.securityTokenNotRetrieved"));
			}.bind(this));
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/ProductEdit.controller.js":function(){// Note that this view is hosted by nw.epm.refapps.ext.prod.manage.view.S3_ProductDetail. Thus, it implements the lifecycle methods show and leave
// defined by this view.
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Component",
	"sap/ui/model/json/JSONModel",
	"sap/ui/comp/odata/MetadataAnalyser",
	"sap/ui/comp/providers/ValueHelpProvider",
	"sap/ui/model/Sorter",
	"sap/ui/Device",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterType",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/ValueState",
	"./SubControllerForShare",
	"nw/epm/refapps/ext/prod/manage/model/formatter"
], function(Controller, Component, JSONModel, MetadataAnalyser, ValueHelpProvider, Sorter, Device, Filter, FilterType, FilterOperator,
	ValueState, SubControllerForShare, formatter) {
	"use strict";

	// This method returns an array that contains all entries of the array aArray that are truthy (in the same order).
	// If all entries of aArray are truthy it is returned, otherwise a new array is returned.
	function fnArrayFilteredTruthy(aArray) {
		var aCopy = null;
		for (var i = 0; i < aArray.length; i++) {
			var oEntry = aArray[i];
			if (oEntry) {
				if (aCopy) {
					aCopy.push(oEntry);
				}
			} else if (!aCopy) {
				aCopy = aArray.slice(0, i);
			}
		}
		return aCopy || aArray;
	}

	return Controller.extend("nw.epm.refapps.ext.prod.manage.controller.ProductEdit", {
		formatter: formatter,
		// --- Helper attributes that are initialized during onInit and never changed afterwards

		// _oViewProperties: json model used to manipulate declarative attributes of the controls used in this view. Initialized in _initViewPropertiesModel.
		// Contains the attribute dataLoaded which is set to true, as soon as the product is loaded
		// _oView: this view
		// _aInputFields:
		// _aMandatoryFields
		// _oApplicationController: the controller of the App
		// _oApplicationProperties: json model containing the App state
		// _oResourceBundle: the resource bundle to retrieve texts from
		// _oHelper: singleton instance of nw.epm.refapps.ext.prod.manage.util.Products used to call backend services
		// _oSubControllerForShare: helper for the share dialog
		// _oSubcategory: input field for the subcategory
		// _oShareDialog: dialog for the share button. Initialized on demand.

		// --- attributes describing the current state
		// _sContextPath:

		// --- Initialization

		onInit: function() {
			// Gets the application component and the data operation helper instance
			this._oView = this.getView();
			this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = this._oApplicationController.getODataHelper();
			this._oSubControllerForShare = new SubControllerForShare(this._oView, this._oResourceBundle);
			this._oCategory = this.byId("categoryBox");
			this._oSubcategory = this.byId("subcategoryBox");
			// Gets and stores array of input fields and mandatory fields
			this._aMandatoryFields = this._getMandatoryFields();
			this._aInputFields = this._aMandatoryFields.concat(this._getNonMandatoryInputFields());

			// Initialize the Sub-View which included the sap.m.UploadCollection control to handle uploading and removing
			// images
			this._initSubViewImageUpload();

			var oModel = oComponent.getModel();
			// This facilitates the value help generated from annotations only
			oModel.attachMetadataLoaded(function() {
				var oInput = this.byId("supplierInput"),
					oMetadataAnalyzer = new MetadataAnalyser(oModel),
					sField = "SupplierName",
					mConfig = oComponent.getMetadata().getConfig(),
					sServiceName = mConfig.serviceConfig.name,
					sAnnotationPath = sServiceName + ".ProductDraft/" + sField,
					oValueListAnnotations = oMetadataAnalyzer.getValueListAnnotation(sAnnotationPath);

				if (oInput) {
					// This is created for side effects Search Help Dialog
					/* eslint-disable */
					new ValueHelpProvider({
						annotation: oValueListAnnotations.primaryValueListAnnotation,
						additionalAnnotations: oValueListAnnotations.additionalAnnotations,
						control: oInput,
						model: oModel,
						preventInitialDataFetchInValueHelpDialog: true,
						supportMultiSelect: false,
						supportRanges: false,
						fieldName: sField,
						title: sField
					});
					/* eslint-enable */
					oInput.setShowValueHelp(true);
				}
			}, this);
		},

		_initViewPropertiesModel: function() {
			// The model created here is used to set values or view element properties that cannot be bound
			// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the
			// alternative of getting each view element by its ID and setting the values directly because a JSon model is more
			// robust if the customer removes view elements (see extensibility).
			this._oViewProperties = new JSONModel({
				dataLoaded: false
			});
			this._oView.setModel(this._oViewProperties, "viewProperties");
		},

		_getMandatoryFields: function() {
			return fnArrayFilteredTruthy([this.byId("productNameInput"), this.byId("priceInput"), this.byId("currencyBox"),
				this._oCategory, this._oSubcategory, this.byId("descriptionArea"),
				this.byId("supplierInput"), this.byId("unitOfMeasureBox")
			]);
		},

		_getNonMandatoryInputFields: function() {
			return fnArrayFilteredTruthy([this.byId("lengthInput"), this.byId("widthInput"), this.byId("heightInput"), this.byId("weightInput")]);
		},

		// helper method to set image upload control
		_initSubViewImageUpload: function() {
			var oSubViewImagesUpload = this.byId("View_ImageUpload");
			if (oSubViewImagesUpload) {
				oSubViewImagesUpload.getController().setInitData({
					oResourceBundle: this._oResourceBundle,
					oDataHelper: this._oHelper,
					fnDirty: this._setDirty.bind(this)
				});
			}
		},

		// --- Lifecycle methods used by the hosting view

		show: function() {
			var sProductDraftID = this._oApplicationProperties.getProperty("/productId");
			this._oViewProperties.setProperty("/dataLoaded", false);
			this._resetValueStates();

			this._sContextPath = this._oHelper.getPathForDraftId(sProductDraftID);
			// Binds the (newly generated) product draft to the view and expands the Images part for the subview
			// ProductDraftUploadImages
			this._oView.bindElement(this._sContextPath, {
				expand: "Images"
			});

			// Checks if the binding context is already available locally. If so, refreshes the binding and retrieves the
			// data from backend again.
			var oBindingContext = this._oView.getBindingContext();
			if (oBindingContext && oBindingContext.getPath() === this._sContextPath) {
				this._oView.getElementBinding().refresh();
			}

			// Updates header and footer after the product draft is retrieved
			this._oView.getElementBinding().attachEventOnce(
				"dataReceived",
				function() {
					oBindingContext = this._oView.getBindingContext();
					if (oBindingContext) {
						// Sets the draft dirty flag based on the backend information
						this._oApplicationProperties.setProperty("/isDirty", oBindingContext.getProperty("IsDirty"));

						this._oViewProperties.setProperty("/dataLoaded", true);
						// in ComboBox
						this._setCategoryFilter(oBindingContext);
					} else {
						// Handle the case if the product draft cannot be retrieved remotely (e.g. it's deleted already)
						// show the corresponding product detail page, since in this app the draft id is supposed to be
						// same as the product id
						this._oApplicationController.showProductDetailPage(sProductDraftID);
					}
					this._oApplicationProperties.setProperty("/isBusyCreatingDraft", false);
				}, this);
		},

		leave: function() {
			this._oView.unbindElement();
		},

		// --- Event handlers attached declaratively

		onSavePressed: function() {
			if (!this._checkAndMarkEmptyMandatoryFields() && !this._fieldWithErrorState()) {
				var fnDraftSaved = function(oControl, oResponse) {
						// When the batch of requests in oData V2 is successfully sent to the backend,
						// the mParameters.success in submitChanges is called. Errors relating to the
						// requests within the batch are not indicated separately and therefore the system must
						// check the requests contained in the batch for errors based on the request response.
						// Makes the assumption that the error returned relates to the field that has been
						// changed. This is not always the case and errors are shown in valueStateText
						// for the field that triggered the save of the draft.
						for (var i = 0; i < oResponse.__batchResponses.length; i++) {
							if (oResponse.__batchResponses[i].response) {
								if (jQuery.sap.startsWith(oResponse.__batchResponses[i].response.body, "{\"error\":")) {
									var oErrModel = new JSONModel();
									oErrModel.setJSON(oResponse.__batchResponses[i].response.body);
									var sMessage = oErrModel.getProperty("/error/message/value");
									if (oControl) {
										oControl.setValueState("Error");
										oControl.setValueStateText(sMessage);
									}
									// Just take the first error message found
									return false;
								}
							}
						}
						return true;
					},
					fnAfterActivation = function(oProductData) {
						this._oApplicationProperties.setProperty("/masterBusyIndicatorDelay", 0);
						this._oApplicationController.showProductDetailPage(oProductData.Id, true);
						this._oApplicationProperties.setProperty("/isBusySaving", false);
						var sMessage = this._oResourceBundle.getText("ymsg.saveText", oProductData.Name);
						sap.ui.require(["sap/m/MessageToast"], function(MessageToast) {
							MessageToast.show(sMessage);
						});
					}.bind(this);
				this._oHelper.activateProduct(fnDraftSaved, fnAfterActivation);
			}
		},

		onCancelPressed: function() {
			var oDraft = this._oView.getBindingContext().getObject(),
				fnNavToProductDetail = function() {
					this._oApplicationProperties.setProperty("/detailBusyIndicatorDelay", null);
					// The system must distinguish between CANCEL chosen in EDIT mode and CANCEL chosen in ADD mode
					// because Cancel Edit navigates to display of that product and Cancel Add to the previously
					// selected product
					var bIsNew = oDraft.IsNewProduct,
						sProductId = bIsNew ? (!Device.system.phone && this._oApplicationProperties.getProperty("/lastDisplay")) : oDraft.ProductId;
					if (sProductId) {
						this._oApplicationController.showProductDetailPage(sProductId);
					} else {
						this._oApplicationController.navToMaster();
					}
				}.bind(this);
			this._deleteProductDraft(fnNavToProductDetail);
		},

		onSharePressed: function(oEvent) {
			this._oSubControllerForShare.openDialog(oEvent);
		},

		onNavButtonPress: function() {
			this._oApplicationController.navBack(true);
		},

		// deleteProductDraft is used in this controller to cancel editing and when
		// the active product has been updated or created.
		_deleteProductDraft: function(fnAfterDeleted, fnDeleteCanceled) {
			this._oHelper.deleteProductDraft(this._sContextPath, fnAfterDeleted, fnDeleteCanceled);
		},

		// --- Input fields

		onNumberChange: function(oEvent) {
			// If a number field is empty, an error occurs in the backend.
			// So this sets a missing number to "0".
			var oField = oEvent.getSource(),
				sNumber = oField.getValue();
			if (sNumber === "") {
				oField.setValue("0");
			}
			this._fieldChange(oField);
		},

		onCategoryChange: function(oEvent) {
			// Do not use submitChanges because the subcategory determines the category and both
			// end up being blank. Only use submitChanges after the subcategory has been changed.
			oEvent.getSource().setValueState(ValueState.None);
			this._setCategoryFilter(this._oView.getBindingContext());
		},

		onInputChange: function(oEvent) {
			// Whenever the value of an input field is changed, the system must
			// update the product draft. For most of the fields, no specific
			// processing is required on the update of the product draft. onInputChange is the
			// change event defined in the XML view for such fields.
			var oField = oEvent.getSource();
			// Workaround to ensure that both the supplier Id and Name are updated in the model before the
			// draft is updated, otherwise only the Supplier Name is saved to the draft and Supplier Id is lost
			setTimeout(function() {
				this._fieldChange(oField);
			}.bind(this), 0);
		},

		onSubcategoryChange: function(oEvent) {
			var sValue = this._oSubcategory.getValue();
			if (!sValue.trim()) {
				return;
			}
			if (this._oCategory) {
				this._oCategory.setValueState(ValueState.None);
				var oSelectedItem = oEvent.getParameter("selectedItem"),
					oBindingContext = oSelectedItem.getBindingContext(),
					sMainCategory = oBindingContext.getProperty("MainCategoryId");
				if (sMainCategory !== this._oCategory.getValue()) {
					this._oCategory.setValue(sMainCategory);
				}
			}
			this._fieldChange(this._oSubcategory);
		},

		onSelectChange: function() {
			// Collect input controls.
			// Additional method for change event on SelectChanges because there is currently
			// no value status for a select field.
			this._setDirty();
			this._oHelper.saveSelectProductDraft();
		},

		// This method has been defined in the XML view and is required by UI5 to call
		// the Suggestions "type ahead" function
		suggestMethod: function(oEvent) {
			sap.m.InputODataSuggestProvider.suggest(oEvent);
		},

		// Values states if set are not automatically removed from the view.  For example, if there
		// are missing mandatory fields and the user presses "save", these fields are set to value state
		// error.  If the user then presses "cancel" and selects another product to edit, the values states
		// must be removed, otherwise the value states appear on the next product edit.
		_resetValueStates: function() {
			jQuery.each(this._aInputFields, function(i, input) {
				input.setValueState(ValueState.None);
			});
		},

		_fieldWithErrorState: function() {
			return this._aInputFields.some(function(input) {
				return (input.getValueState() === ValueState.Error);
			});
		},

		_fieldChange: function(oControl) {
			// Handler for a changed field that needs to be written to the draft.  This allows
			// specific processing for the "Change" event on the input fields, such as for numbers
			// to set empty to "0".
			this._setDirty();
			// Removes previous error state
			oControl.setValueState(ValueState.None);
			// Callback function in the event that saving draft is unsuccessful
			var fnSubmitDraftSuccess = function(sMessage) {
				if (sMessage && oControl) {
					oControl.setValueState("Error");
					oControl.setValueStateText(sMessage);
				}
			};
			this._oHelper.saveProductDraft(fnSubmitDraftSuccess);
		},

		// Set the empty mandatory fields to Value State Error
		// Return whether at least one mandatory field is still empty
		_checkAndMarkEmptyMandatoryFields: function() {
			var bErrors = false;
			// Check that inputs are not empty or space.
			// This does not happen during data binding because this is only triggered by changes.
			// Note that this loop must not stop with the first found error, since for all mandatory fields the value state must be updated.
			jQuery.each(this._aMandatoryFields, function(i, input) {
				if (!input.getValue() || input.getValue().trim() === "") {
					bErrors = true;
					input.setValueState(ValueState.Error);
				}
			});
			return bErrors;
		},

		_setCategoryFilter: function(oBindingContext) {
			if (this._oSubcategory) {
				var sMainCatgId = oBindingContext.getProperty("MainCategoryId"),
				sSubCatgId = oBindingContext.getProperty("SubCategoryId"),
					aFilters = sMainCatgId ? [new Filter("MainCategoryName", FilterOperator.StartsWith, sMainCatgId)] : [],
					oBinding = this._oSubcategory.getBinding("items");
				if (sMainCatgId) {
					oBinding.attachEventOnce("change", function() {
						var aBindings = oBinding.getContexts(),
							bIsValueValid = aBindings.some(function(oEntry) {
								return sSubCatgId === oEntry.getProperty("Id");
							}).bind(this);
						if (!bIsValueValid) {
							this._oSubcategory.setValue(" ");
						}
					}, this);
				} else {
					this._oSubcategory.setValue(" ");
				}
				oBinding.filter(aFilters, FilterType.Application);
			}
		},

		_setDirty: function() {
			this._oApplicationProperties.setProperty("/isDirty", true);
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/S2_ProductMaster.controller.js":function(){sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/m/GroupHeaderListItem",
	"sap/m/ListMode",
	"./TableOperations",
	"./SubControllerForFGS",
	"nw/epm/refapps/ext/prod/manage/model/formatter"
], function(Controller, JSONModel, Device, GroupHeaderListItem, ListMode, TableOperations, SubControllerForFGS, formatter) {
	"use strict";

	return Controller.extend("nw.epm.refapps.ext.prod.manage.controller.S2_ProductMaster", {
		formatter: formatter,

		// --- Helper attributes that are initialized during onInit and never changed afterwards

		// _oViewProperties: json model used to manipulate declarative attributes of the controls used in this view. Initialized in _initViewPropertiesModel.
		// contains the following attributes:
		// - title                - the current title of the master list
		// - markExists           - in multi-select mode: info whether at least one entry is marked
		// - filterToolbarVisible - flag whether the filter toolbar is visible on top of the master list
		// - filterInfoText       - text of the filter toolbar
		// _oView: this view
		// _oList: the master list
		// _oItemTemplate: template of one list item. Used for modifying the list binding.
		// _oSearchField: the search field
		// _oApplicationController: the controller of the App
		// _oApplicationProperties: json model containing the App state
		// _oResourceBundle: the resource bundle to retrieve texts from
		// _oHelper: singleton instance of nw.epm.refapps.ext.prod.manage.model.Products used to call backend services
		// _oTableOperations: instance of nw.epm.refapps.ext.prod.manage.controller.TableOperations used for backend handling of list operations
		// _oSubControllerForFGS: instance of nw.epm.refapps.ext.prod.manage.controller.SubControllerForFGS used for frontend handling of list operations

		// --- Attributes describing the current state of the master list. They are changed while the App is running.

		// _iMarkedCount:number of items selected in multi-selection mode.
		// _sCurrentSearchTerm: the search term that is currently used to filter the result list
		// _fnAdaptListAfterUpdate: An optional function that will be executed when a list update finishes the next time

		// --- Initialization

		onInit: function() {
			this._iMarkedCount = 0;
			this._sCurrentSearchTerm = "";
			this._oView = this.getView();
			this._oList = this.byId("list");
			this._oSearchField = this.byId("SearchField");
			var oComponent = this.getOwnerComponent();
			this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			this._oApplicationController.registerMaster(this);
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = this._oApplicationController.getODataHelper();
			this._oTableOperations = new TableOperations(this._oList, ["Name", "Id", "Description"]);
			this._initViewPropertiesModel();
			// Initializes the sub-controller for handling filter, grouping, and sorting dialogs
			this._oSubControllerForFGS = new SubControllerForFGS(this._oView,
				this._oTableOperations, this.applyTableOperations.bind(this), this._oResourceBundle);
		},

		_initViewPropertiesModel: function() {
			// The model created here is used to set values or view element properties that cannot be bound
			// directly to the OData service. Setting view element attributes by binding them to a model is preferable to the
			// alternative of getting each view element by its ID and setting the values directly because a JSon model is more
			// robust if the customer removes view elements (see extensibility).
			this._oViewProperties = new JSONModel({
				title: this._oResourceBundle.getText("xtit.masterTitleWithoutNumber"),
				markExists: false,
				filterToolbarVisible: false,
				filterInfoText: ""
			});
			this._oView.setModel(this._oViewProperties, "viewProperties");
		},

		// --- Methods dealing with refresh of the list

		applyTableOperations: function() {
			// This method is called when a new backend search has to be triggered, due to changed 'search settings'.
			// More precisely the method is called:
			// - when the user presses Sort, Filter, or Group button (therefore, it is passed as callback to SubControllerForFGS)
			// - when the user triggers a search after having changed the entry in the search field
			// The method uses attribute _oTableOperations to perform the data retrieval
			this._oTableOperations.applyTableOperations();
			if (!Device.system.phone) {
				this._fnAdaptListAfterUpdate = function() {
					var sProductId = this._oApplicationProperties.getProperty("/productId"),
						oListItem = this._getListItemForId(sProductId);
					this._scrollToListItem(oListItem);
				}.bind(this);
			}
		},

		createGroupHeader: function(oGroup) {
			// Group header factory. Attached to the list declaratively.
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		onUpdateStarted: function() {
			// Event handler called when updater of the the master list starts. It is attached declaratively.
			// Resets the displayed content of the search field to the search term that is actually used.
			// There may be a difference, as the user might have changed the content but not triggered the search.
			this._oSearchField.setValue(this._sCurrentSearchTerm);
			this._oApplicationProperties.setProperty("/isListLoading", true);
		},

		onUpdateFinished: function() {
			// Event handler called after the the master list has been updated. It is attached declaratively.
			if (this._oApplicationProperties.getProperty("/metaDataLoadState") < 1) {
				return;
			}
			this._oApplicationProperties.setProperty("/isListLoading", false);
			this._oApplicationProperties.setProperty("/masterBusyIndicatorDelay", null);
			var iCount = this._getListBinding().getLength(),
				sTitle = this._oResourceBundle.getText("xtit.masterTitleWithNumber", [iCount]);
			this._oViewProperties.setProperty("/title", sTitle);
			if (iCount === 0) {
				var sNoDataId = ((this._oTableOperations.getSearchTerm() || this._oTableOperations.getFilterTable()) ? "ymsg.noDataAfterSerach" :
					"ymsg.noProducts");
				this._oApplicationProperties.setProperty("/listNoDataText", this._oResourceBundle.getText(sNoDataId));
			}
			if (this._isListInMultiSelectMode()) {
				this._iMarkedCount = this._oList.getSelectedContexts(true).length;
				this._oViewProperties.setProperty("/markExists", this._iMarkedCount > 0);
			}
			// If not on the phone, make sure that a PO is selected (if possible)
			this.findItem();
			if (this._fnAdaptListAfterUpdate) {
				this._fnAdaptListAfterUpdate();
				this._fnAdaptListAfterUpdate = null;
			}
		},

		listRefresh: function() {
			this._getListBinding().refresh();
		},

		adaptToDetailSelection: function(bScrollTo) {
			// adapt the state of the master list to the object displayed in the detail area
			// This contains two aspects:
			// - set the corresponding list item as selected
			// - scroll to the corresponding list item (only if bScrollTo is true)
			if (this._oApplicationProperties.getProperty("/isListLoading") || this._oApplicationProperties.getProperty("/metaDataLoadState") < 1) {
				// Postpone until the list has been loaded
				this._fnAdaptListAfterUpdate = this._selectCurrentItem.bind(this, bScrollTo);
			} else {
				this._selectCurrentItem(bScrollTo);
			}
		},

		_selectCurrentItem: function(bScrollTo) {
			// this method has the same specification as adaptToDetailSelection. However, it must not be called
			// while the list is still loading.
			if (Device.system.phone || this._isListInMultiSelectMode()) {
				return;
			}
			var sProductId = this._oApplicationProperties.getProperty("/productId"),
				oItemToSelect = sProductId && this._getListItemForId(sProductId);
			if (oItemToSelect === this._oList.getSelectedItem()) {
				return;
			}
			this._setItemSelected(oItemToSelect);
			if (bScrollTo && oItemToSelect) {
				this._scrollToListItem(oItemToSelect);
			}
		},

		findItem: function() {
			// This method has four tasks:
			// - Check whether it is necessary to identify a new list item to be displayed in the detail area (if not return immediately)
			// - Determine the required list item
			// - Execute the navigation that displays the identified list item (or execute the navigation to the EmptyPage if no list item could be identified)
			// - Reset state		    
			if (Device.system.phone || this._oApplicationProperties.getProperty("/productId")) { // Task 1
				return;
			}
			// Task 2
			var aItems = this._oList.getItems();
			if (aItems.length > 0) {
				var oItemToSelect = null,
					aPreferredIds = this._oApplicationProperties.getProperty("/preferredIds");
				for (var i = 0; !oItemToSelect && i < aPreferredIds.length; i++) {
					oItemToSelect = this._getListItemForId(aPreferredIds[i]);
				}
				oItemToSelect = oItemToSelect || this._getFirstRealItem();
				this._navToListItem(oItemToSelect); // Task 3
			} else {
				this._oApplicationController.navToEmptyPage(this._oApplicationProperties.getProperty("/listNoDataText"), true); // Task 3
			}
			this._oApplicationProperties.setProperty("/preferredIds", []); // Task 4
		},

		prepareForDelete: function(sCurrentId) {
			// This method is called before a delete operation is called. 
			// The task of this method is to set the preferredIds in the global application model.
			// This array will be checked afterwards to determine the item in the list which will be selected.
			// More precisely the first product in this array which occurs in the list after the deletion process will be selected.
			// sCurrentId can be faulty (which would mean that currently no item is selected in the detail area -> preferred ids is set to the empty array).
			// Otherwise sCurrentId is the id of the product currently displayed in the detail area, and sCurrentId is one of the
			// objects to be deleted.
			// The preferredIds are set to the ids of the products currently displayed in the list, sorted according the following order:
			// If the current list contains an item corresponding to sCurrentId, sCurrentId will be the first one in the list.
			// It will be followed by the ids of the list items behind this item in the normal order. After that we add the ids
			// of the list items in front of the identified one, but in reverse order.
			// Otherwise the preferred ids are the ids of current list in their normal order.
			// So when the current order is a, b, c, d, e and sCurrentId is c, then the preferred ids will be c, d, e, b, a.
			// Note that according to the precondition c itself identifies one of the objects to be deleted. Therefore, the first entry
			// in the list will only be used later, when the deletion of this particular object fails for some reason.
			var aPreferredIds = [];
			if (sCurrentId) {
				var bFound = false,
					aListItems = this._oList.getItems(),
					aTail = [];
				for (var i = 0; i < aListItems.length; i++) {
					var oItem = aListItems[i];
					if (!(oItem instanceof GroupHeaderListItem)) {
						var oCtx = oItem.getBindingContext(),
							sId = oCtx.getProperty("Id");
						bFound = bFound || sId === sCurrentId;
						(bFound ? aPreferredIds : aTail).push(sId);
					}
				}
				if (bFound) {
					aTail.reverse();
					aPreferredIds = aPreferredIds.concat(aTail);
				}
			}
			this._oApplicationProperties.setProperty("/preferredIds", aPreferredIds);
		},

		_getListBinding: function() {
			return this._oList.getBinding("items");
		},

		// --- Methods dealing with new data retrieval triggered by the user. All event handlers are attached declaratively.

		onSearch: function(oEvent) {
			// Event handler for the search field in the master list.
			// Note that this handler listens to the search button and to the refresh button in the search field
			var oSearchField = oEvent.getSource(),
				sCurrentSearchFieldContent = oSearchField.getValue(),
				// If the user has pressed 'Refresh' the last search should be repeated
				sNewSearchContent = oEvent.getParameter("refreshButtonPressed") ? this._sCurrentSearchTerm : sCurrentSearchFieldContent;
			this._explicitRefresh(sNewSearchContent);
		},

		_explicitRefresh: function(sNewSearchContent, fnNoMetadata) {
			// This method is called when the user refreshes the list either via the search field or via the pull-to-refresh element
			// sNewSearchContent is the content of the search field to be applied.
			// Note: In case metadata could not be loaded yet or lost draft information could not be determined yet, it is first triggered
			// to retry this. If loading of the metadata fails (optional) fnNoMetadata will be executed.
			var fnMetadataLoaded = function() {
				if (sNewSearchContent === this._sCurrentSearchTerm) {
					this.listRefresh();
				} else {
					this._sCurrentSearchTerm = sNewSearchContent;
					this._oTableOperations.setSearchTerm(sNewSearchContent);
					this.applyTableOperations();
				}
			}.bind(this);
			this._oApplicationController.whenMetadataLoaded(fnMetadataLoaded, fnNoMetadata);
		},

		onPullToRefresh: function(oEvent) {
			// Event handler for the pullToRefresh-element of the list.
			var oPullToRefresh = oEvent.getSource(),
				fnHidePullToRefresh = function() { // hide the pull to refresh when list has been refreshed or meta data call fails once more
					// Note: Do not use oEvent here, because UI5 might have reinitialized this instance already (instance pooling for performance reasons)
					oPullToRefresh.hide();
				};
			// Hide the pull to refresh when data has been loaded
			this._oList.attachEventOnce("updateFinished", fnHidePullToRefresh);
			// Refresh list from backend
			this._explicitRefresh(this._sCurrentSearchTerm, fnHidePullToRefresh);
		},

		// - Event handlers for the Sort, Filter, and Group buttons. They delegate to attribute _oSubControllerForFGS.

		onSortPressed: function() {
			this._oSubControllerForFGS.openDialog("ProductSortDialog", "Name");
		},

		onFilterPressed: function() {
			this._oSubControllerForFGS.openDialog("ProductFilterDialog");
		},

		onGroupPressed: function() {
			this._oSubControllerForFGS.openDialog("ProductGroupingDialog");
		},

		// --- Event handlers for additional buttons in the footer of the master area. They are attached declaratively.

		onAddPressed: function() {
			var fnProductDraftCreated = function(oProductDraftData) {
				this._oApplicationProperties.setProperty("/isDirty", false);
				this._oApplicationController.navToProductEditPage(oProductDraftData.Id);
				this._removeAllSelections();
				this._oApplicationController.hideMasterInPortrait();
			}.bind(this);
			this._oHelper.createProductDraft(fnProductDraftCreated);
		},

		onDeletePressed: function() {
			var aContexts = this._oList.getSelectedContexts(true),
				aProductsToBeDeleted = [];
			jQuery.each(aContexts, function(iIndex, oContext) {
				aProductsToBeDeleted.push(oContext.getPath());
			});
			var fnAfterDeleted = function() {
				this._removeAllSelections();
			}.bind(this);
			this._oHelper.deleteProducts(aProductsToBeDeleted, fnAfterDeleted);
		},

		// --- Methods dealing with multi-select

		onMultiSelectPressed: function() {
			// Event handler for the multi-selection button in the page header. It is attached declaratively.
			var bWasMultiSelect = this._isListInMultiSelectMode();
			this._setMultiSelect(!bWasMultiSelect);
		},

		_setMultiSelect: function(bMultiSelect) {
			// set the master list to multi-select or single select as specified by bMultiSelect
			if (bMultiSelect === this._isListInMultiSelectMode()) {
				return;
			}
			this._oApplicationProperties.setProperty("/isMultiSelect", bMultiSelect);
			this._removeAllSelections();
			if (!bMultiSelect && !Device.system.phone) {
				var oSelectedItem = this._getListItemForId(this._oApplicationProperties.getProperty("/productId"));
				this._setItemSelected(oSelectedItem);
			}
		},

		_isListInMultiSelectMode: function() {
			// helper method to check if the current list is currently in the MultiSelect mode
			return this._oList.getMode() === ListMode.MultiSelect;
		},

		_removeAllSelections: function() {
			// set all items as unselected
			this._oList.removeSelections(true);
			this._iMarkedCount = 0;
			this._oViewProperties.setProperty("/markExists", false);
		},

		// --- Event handlers for additional UI elements. All of them are attached declaratively.

		onNavButtonPress: function() {
			// Handler for the nav button of the page.
			this._oApplicationController.navBack(false);
		},

		onSwipe: function(oEvent) {
			// Event handler for swipe in the list.
			// Its purpose is to deactivate swipe in case of multi select and in edit mode.
			if (this._isListInMultiSelectMode() || this._isInEditMode()) {
				oEvent.preventDefault();
			}
		},

		onSwipeDeleteItem: function() {
			// user has confirmed the deletion via swipe
			var oBindingContext = this._oList.getSwipedItem().getBindingContext();
			this._oHelper.deleteProduct(oBindingContext.getPath(), null, true);
			this._oList.swipeOut();
		},

		onItemSelect: function(oEvent) {
			// Event handler for the case that the user selects one item in the master list.
			// Note: This method is referred twice in the declarative definition of this view.
			// The first reference is event 'selectionChange' of the master list; the second one is 'press' on the list item.
			// The second reference is needed in case the list mode is 'None' (which is true on phone).
			// Determine the list item that was selected. Note that the techique to retrieve this from the event depends
			// on the list mode (in other words, the event we are currently listening to).
			var oListItem = this._oList.getMode() === ListMode.None ? oEvent.getSource() : oEvent.getParameter("listItem");

			var bMultiSelect = this._isListInMultiSelectMode();
			if (bMultiSelect) { // in multi-select mode select mode selecting the list item inverts the current selection state
				if (oEvent.getParameter("selected")) { // the item turns into selected
					this._iMarkedCount++;
					if (!Device.system.phone) { // in this case the newly selected item should be displayed in the detail area,
						this._navToListItem(oListItem);
					}
				} else { // the item turns into unselected
					this._iMarkedCount--;
				}
				this._oViewProperties.setProperty("/markExists", this._iMarkedCount > 0);
			} else { // in single-select mode the user wants to navigate to the selected item
				if (this._isInEditMode()) { // in edit mode a data-loss popup might be necessary
					var fnLeaveCancelled = function() { // called when user decides to cancel the navigation due to possible data-loss
						this._setItemSelected(this._getListItemForId(this._oApplicationProperties.getProperty("/productId"))); // set back selection to the item being edited (if it is in the list)
					};
					this._leaveEditPage(this._navToListItem.bind(this, oListItem), fnLeaveCancelled.bind(this));
				} else {
					this._navToListItem(oListItem);
				}
				this._oApplicationController.hideMasterInPortrait();
			}
		},

		// --- internal helper methods

		_navToListItem: function(oListItem) {
			// This method triggers the navigation to the detail page with the specified list item oListItem
			var oCtx = oListItem.getBindingContext(),
				sProductId = oCtx.getProperty("Id");
			this._oApplicationController.showProductDetailPage(sProductId);
		},

		_setItemSelected: function(oItemToSelect) {
			// Set the specified list item to be selected, resp. remove all selections if the specififed item is faulty
			if (oItemToSelect) {
				this._oList.setSelectedItem(oItemToSelect);
			} else {
				this._removeAllSelections();
			}
		},

		_getListItemForId: function(sId) {
			// Return the list item for the specified product id or a faulty value if the list does not contain the product.
			if (!sId || sId === "-") {
				return null;
			}
			var aItems = this._oList.getItems();
			for (var i = 0; i < aItems.length; i++) {
				var oItem = aItems[i];
				if (!(oItem instanceof GroupHeaderListItem)) {
					var oContext = oItem.getBindingContext();
					if (oContext && oContext.getProperty("Id") === sId) {
						return oItem;
					}
				}
			}
		},

		_scrollToListItem: function(oListItem) {
			// Scroll the list to the given list item.
			if (!oListItem || oListItem === this._getFirstRealItem()) {
				// If the item to scroll to is the first, just scroll to top. This ensures that the info toolbar and a top
				// grouping item will be shown if available.
				var oPage = this.byId("masterPage");
				oPage.scrollTo(0);
			} else {
				var oDomRef = oListItem.getDomRef();
				if (oDomRef) {
					oDomRef.scrollIntoView();
				}
			}
		},

		_isInEditMode: function() {
			return !this._oApplicationProperties.getProperty("/noEditMode");
		},

		_leaveEditPage: function(fnLeave, fnLeaveCancelled) {
			// leave the edit page. If the current draft is dirty the user will get a data loss poup.
			// fnLeave is the function that will be called when the edit page is really left
			// fnLeaveCancelled is the function that is called when the user cancels the operation
			var sPath = this._oHelper.getPathForDraftId(this._oApplicationProperties.getProperty("/productId"));
			this._oHelper.deleteProductDraft(sPath, fnLeave, fnLeaveCancelled);
		},

		_getFirstRealItem: function() {
			// Returns the first item of the list which is not a grouping item. Returns a faulty value if list is empty.
			var aItems = this._oList.getItems();
			for (var i = 0; i < aItems.length; i++) {
				if (!(aItems[i] instanceof GroupHeaderListItem)) {
					return aItems[i];
				}
			}
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/S3_ProductDetail.controller.js":function(){// Actually we have two detail views, namely nw.epm.refapps.ext.prod.manage.view.ProductDisplay and
// nw.epm.refapps.ext.prod.manage.view.ProductEdit.
// Since the same route is used for both of them, this view is used as host for both of them.
// The NavContainer with id 'content' will always display the instance which is currently required.
// This view is informed by the controller of the app via methods editModeChanged and productChanged that it
// should adapt to the current global state.
// This is done by informing the controllers of those subviews via methods leave and show about the new situation.
// Afterwards the view to be displayed in the content is adapted.
sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function(Controller) {
	"use strict";

	return Controller.extend("nw.epm.refapps.ext.prod.manage.controller.S3_ProductDetail", {
		// _oApplicationProperties: the global model of the App
		// _oContent: the NavContainer hosting the 'real' view
		// _oDisplayView: the view used in display mode
		// _oEditView: the view used in edit mode
		// _oCurrentView: the view currently used (either _oDisplayView or _oEditView)

		onInit: function() {
			var oComponent = this.getOwnerComponent();
			this._oApplicationProperties = oComponent.getModel("appProperties");
			var oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			oApplicationController.registerDetail(this);
			this._oContent = this.byId("content");
			this._oDisplayView = this.byId("display");
			this._oEditView = this.byId("edit");
			this._oCurrentView = this._oDisplayView;
			this._oContent.to(this._oCurrentView);
		},

		editModeChanged: function() {
			// This method is called by the controller of the app in case the mode has possibly changed.
			// It returns the information whether it was really necessary to exchange the views.
			var bIsEditMode = !this._oApplicationProperties.getProperty("/noEditMode"); // retrieve the current mode from the global model
			var oView = bIsEditMode ? this._oEditView : this._oDisplayView;
			if (this._oCurrentView === oView) {
				return false;
			}
			this._oCurrentView.getController().leave();
			this._oCurrentView = oView;
			oView.getController().show();
			this._oContent.to(oView);
			return true;
		},

		productChanged: function() {
			// This method is called when the product to be displayed has possibly been changed
			this._oCurrentView.getController().show(); // Just forward to the current view
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/SubControllerForFGS.js":function(){// Creates a sub-controller to be used by the master controller to handle specifically filtering, grouping, and sorting
// dialogs
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"./utilities"
], function(Object, Filter, Sorter, utilities) {
	"use strict";

	// Reads the SAP attribute label from the list-item context
	function fnGetSAPLabel(oListItemContext, sAttributeName) {
		return oListItemContext.getProperty("/#Product/" + sAttributeName + "/@sap:label");
	}

	return Object.extend("nw.epm.refapps.ext.prod.manage.controller.SubControllerForFGS", {
		// _aDialogs
		// _oParentView:
		// _oResourceBundle:
		// _fnApplyTableOperations:
		// _oPriceGroups:

		constructor: function(oParentView, oTableOperations, fnApplyTableOperations, oResourceBundle) {
			this._oParentView = oParentView;
			this._oResourceBundle = oResourceBundle;
			this._oTableOperations = oTableOperations;
			this._fnApplyTableOperations = fnApplyTableOperations;
			this._aDialogs = [];

			var sTextBelow100 = this._getText("xfld.groupPriceBetween", [" 0-100"]),
				sTextBelow500 = this._getText("xfld.groupPriceBetween", [" 100-500"]),
				sTextBelow1000 = this._getText("xfld.groupPriceBetween", [" 500-1000"]),
				sTextAbove1000 = this._getText("xfld.groupPrice", [" 1000"]);

			// Sets the pre-defined price ranges for use in grouping. The texts can only be defined once i18n bundle is
			// available because the text "price between" is defined only once.
			this._oPriceGroups = {
				"LE100": sTextBelow100,
				"BT100-500": sTextBelow500,
				"BT500-1000": sTextBelow1000,
				"GT1000": sTextAbove1000,
				"unknownPrice": "?"
			};
			var oViewPropertiesModel = oParentView.getModel("viewProperties");
			oViewPropertiesModel.setProperty("/LE100", sTextBelow100);
			oViewPropertiesModel.setProperty("/BT100-500", sTextBelow500);
			oViewPropertiesModel.setProperty("/BT500-1000", sTextBelow1000);
			oViewPropertiesModel.setProperty("/GT1000", sTextAbove1000);
		},

		// Opens the requested filter, grouping, and sorting dialogs
		openDialog: function(sDialogFragmentName, sInitialSelection) {
			sDialogFragmentName = "nw.epm.refapps.ext.prod.manage.view." + sDialogFragmentName;
			var oDialog = this._aDialogs[sDialogFragmentName];
			if (!oDialog) {
				this._aDialogs[sDialogFragmentName] = oDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
				utilities.attachControlToView(this._oParentView, oDialog);
				if (sInitialSelection) {
					oDialog.setSelectedSortItem(sInitialSelection);
				}
			}
			return oDialog.open();
		},

		// Handler for the filter criteria, which is set by the user
		onFilterDialogConfirm: function(oEvent) {
			var params = oEvent.getParameters(),
				bPrice = false,
				bStockQuantity = false,
				sText = "",
				aFilterItems = params.filterItems, // Array of type ViewSettingsItem
				iLength = aFilterItems.length;
			// Rebuilds filters every time. Makes it easier if the user has removed filter selections
			this._oTableOperations.resetFilters();

			// Determines which filters the user selected according to the predefined price and stock filters
			for (var i = 0; i < iLength; i++) {
				// Determines which price filters have been selected using the keys
				var oSelectedFilterExpression = this._oPriceFilters[aFilterItems[i].getKey()];
				if (oSelectedFilterExpression) {
					this._oTableOperations.addFilter(oSelectedFilterExpression, "Price");
					bPrice = true;
				} else {
					// Searches for stock filter based on the key specified
					oSelectedFilterExpression = this._oStockFilters[aFilterItems[i].getKey()];
					if (oSelectedFilterExpression) {
						this._oTableOperations.addFilter(oSelectedFilterExpression, "StockQuantity");
						bStockQuantity = true;
					}
				}
			}
			// Updates table operation settings and updates list binding accordingly
			this._fnApplyTableOperations();

			// Shows/hides infoToolbar in the list
			var oViewPropertiesModel = this._oParentView.getModel("viewProperties"),
				bFilterToolbarVisible = !!this._oTableOperations.getFilterTable();
			oViewPropertiesModel.setProperty("/filterToolbarVisible", bFilterToolbarVisible);
			if (bFilterToolbarVisible) {
				if (bPrice && bStockQuantity) {
					sText = this._getText("xtit.filterBy2", [this._getPriceLabel(), this._getText("xfld.availability")]);
				} else {
					// Sets text if price filter is selected
					sText = bPrice ? this._getText("xtit.filterBy", [this._getPriceLabel()]) : "";
					// Sets text if stock filter is selected
					sText = (!sText && bStockQuantity) ? this._getText("xtit.filterBy", [this._getText("xfld.availability")]) : sText;
				}
				oViewPropertiesModel.setProperty("/filterInfoText", sText);
			}
		},

		_getPriceLabel: function() {
			return this._oParentView.getModel().getProperty("/#Product/Price/@sap:label");
		},

		// Defines the price filter settings available
		_oPriceFilters: {
			"LE100": new Filter("Price", sap.ui.model.FilterOperator.LE, "100"),
			"BT100-500": new Filter("Price", sap.ui.model.FilterOperator.BT, "100", "500"),
			"BT500-1000": new Filter("Price", sap.ui.model.FilterOperator.BT, "500", "1000"),
			"GT1000": new Filter("Price", sap.ui.model.FilterOperator.GE, "1000")
		},

		// Defines the stock availability filter settings available
		_oStockFilters: {
			"outofstock": new Filter("StockQuantity", sap.ui.model.FilterOperator.EQ, "0"),
			"restrictedstock": new Filter("StockQuantity", sap.ui.model.FilterOperator.BT, "1", "9"),
			"instock": new Filter("StockQuantity", sap.ui.model.FilterOperator.GE, "10")
		},

		// Handler for the Confirm button on the sort dialog. Depending on the selections made on the sort
		// dialog, the respective sorters are created and stored in the _oTableOperations object.
		// The actual setting of the sorters on the binding is done in function setSorters
		onSortDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters(),
				sSortPath = mParams.sortItem.getKey();
			this._oTableOperations.addSorter(new Sorter(sSortPath, mParams.sortDescending));
			this._fnApplyTableOperations();
		},

		// Handler for the grouping criteria, which are set by the user
		onGroupingDialogConfirmed: function(oEvent) {
			var mParams = oEvent.getParameters(),
				sortPath;
			if (mParams.groupItem) {
				sortPath = mParams.groupItem.getKey();
				if (sortPath !== "") {
					this._oTableOperations.setGrouping(new Sorter(sortPath, mParams.groupDescending,
						this._oGroupFunctions[sortPath].bind(this)));
				} else {
					this._oTableOperations.removeGrouping();
				}
			}
			this._fnApplyTableOperations();
		},

		_oGroupFunctions: {

			// Assumption is that all prices contain the currency code and that the currency conversion has to be done in
			// the backend system of the app
			Price: function(oListItemContext) {
				var sKey, iPrice = Number(oListItemContext.getProperty("Price"));
				if (iPrice <= 100) {
					sKey = "LE100";
				} else if (iPrice <= 500) {
					sKey = "BT100-500";
				} else if (iPrice <= 1000) {
					sKey = "BT500-1000";
				} else if (iPrice > 1000) {
					sKey = "GT1000";
				} else {
					sKey = "unknownPrice";
				}

				return {
					key: sKey,
					text: this._oPriceGroups[sKey]
				};
			},

			StockQuantity: function(oListItemContext) {
				var iQuantity = Number(oListItemContext.getProperty("StockQuantity")),
					// Sets the default key and text if iQuantity is negative or NaN.
					sKey = "unknownStockQuantity",
					sText = "?";
				if (iQuantity >= 0) {
					var sLabel = fnGetSAPLabel(oListItemContext, "StockQuantity");
					if (iQuantity === 0) {
						sKey = "LE0";
					} else if (iQuantity >= 10) {
						sKey = "GE10";
					} else {
						sKey = "BT1-9";
					}
					var sI18NKey = iQuantity === 0 ? "xfld.outstock" : (iQuantity < 10 ? "xfld.restricted10" : "xfld.instock"),
						sValue = this._oResourceBundle.getText(sI18NKey);
					sText = this._oResourceBundle.getText("xfld.groupingLabel", [sLabel, sValue]);
				}
				return {
					key: sKey,
					text: sText
				};
			},

			MainCategoryName: function(oListItemContext) {
				return this._getCategoryName(oListItemContext, "MainCategoryName");
			},

			SubCategoryName: function(oListItemContext) {
				return this._getCategoryName(oListItemContext, "SubCategoryName");
			}
		},

		// Reads the corresponding category name based on the list-item context
		_getCategoryName: function(oListItemContext, sCategoryType) {
			var sKey = oListItemContext.getProperty(sCategoryType);
			return {
				key: sKey,
				text: this._getText("xfld.groupingLabel", [fnGetSAPLabel(oListItemContext, sCategoryType), sKey])
			};
		},

		// Shortcut to get i18n text
		_getText: function() {
			return this._oResourceBundle.getText.apply(this._oResourceBundle, arguments);
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/SubControllerForShare.js":function(){// Creates a sub-controller to be used by the detail controller to handle the share dialog
sap.ui.define([
	"sap/ui/base/Object",
	"./utilities",
	"nw/epm/refapps/ext/prod/manage/model/formatter"
], function(Object, utilities, formatter) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.prod.manage.controller.SubControllerForShare", {
		formatter: formatter,
		//_oShareDialog:
		//_oParentView:
		//_oResourceBundle:
		//_oProduct:

		constructor: function(oParentView, oResourceBundle) {
			this._oParentView = oParentView;
			this._oResourceBundle = oResourceBundle;
		},

		// Opens the share dialog
		openDialog: function(oEvent) {
			var oShareButton = oEvent.getSource();
			this._oProduct = this._oParentView.getBindingContext().getObject();
			if (!this._oShareDialog) {
				this._oShareDialog = sap.ui.xmlfragment(this._oParentView.getId(), "nw.epm.refapps.ext.prod.manage.view.ShareSheet", this);
				// Switch the dialog to compact mode if the hosting view has compact mode
				utilities.attachControlToView(this._oParentView, this._oShareDialog);
			}
			this._oShareDialog.openBy(oShareButton);
		},

		onEmailPressed: function() {
			this._triggerEmail();
		},

		_triggerEmail: function() {
			sap.m.URLHelper.triggerEmail(null, this._getEmailSubject(), this._getEmailContent());
		},

		_getEmailSubject: function() {
			return this._oResourceBundle.getText("xtit.emailSubject", [this._oProduct.Name]);
		},

		_getEmailContent: function() {
			return this._oResourceBundle.getText("xtit.emailContent", [this._oProduct.Id, this._oProduct.Description,
				this._oProduct.SupplierName
			]);
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/TableOperations.js":function(){sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/Sorter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterType",
	"sap/ui/model/FilterOperator"
], function(Object, Sorter, Filter, FilterType, FilterOperator) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.prod.manage.util.TableOperations", {
		// Object holding the active sorters of a list. It is used to make sure that
		// setting a new sorter with "sort list" does not break a sorting that was
		// previously set by "grouping".
		// When the list is sorted or grouped the list of sorters that is applied to
		// the binding is built by concatenating oGrouper and aSortList of this
		// object into one array.
		// Sorting and grouping is done with the following rules:
		// 1. selecting a sorter on the table adds the new sorter as the main sorter
		// to all existing sorters
		// 2. if grouping and sorting are both set for the same attribute then the
		// direction (ascending/descending) has to be aligned
		// The search related attributes are public because there is no special
		// logic for setting them so they can be used directly.

		constructor: function(oTable, aSearchableFields, oDefaultSorter) {
			// Storage of the active grouping and sorting is private because
			// of their interdependency
			var sSearchTerm = "",
				oGrouper = null,
				aFilterList = [],
				aSearchFilter = [],
				bGroupingChanged = false,
				bSearchChanged = false,
				bFilterChanged = false,
				bSortChanged = false,
				aSortList = [(oDefaultSorter) ? oDefaultSorter : new Sorter("Name", false)],
				oFilterDict = {};

			this._resetChangeIndicators = function() {
				bGroupingChanged = false;
				bSearchChanged = false;
				bFilterChanged = false;
				bSortChanged = false;
			};

			this.addSorter = function(oSorter) {
				// Delete any existing sorter for the path specified
				var i = this._getSortListIndexByPath(oSorter.sPath);
				if (i !== -1) {
					aSortList.splice(i, 1);
				}
				// The latest sorter is always the "main" sorter -> add it to the
				// beginning of the array
				aSortList.unshift(oSorter);
				// Copy the sort order of the new sorter to the grouper if they
				// refer to the same path
				if (oGrouper && oGrouper.sPath === oSorter.sPath) {
					oGrouper.bDescending = oSorter.bDescending;
				}
				bSortChanged = true;
			};
			this.setGrouping = function(oNewGrouper) {
				// If there is already a sorter for the path specified, the sorting order
				// must be the same as in the new grouper
				var i = this._getSortListIndexByPath(oNewGrouper.sPath);
				if (i !== -1) {
					aSortList[i].bDescending = oNewGrouper.bDescending;
				}
				oGrouper = oNewGrouper;
				bGroupingChanged = true;
			};

			this._getSortListIndexByPath = function(sPath) {
				var i;
				for (i = 0; i < aSortList.length; i++) {
					if (aSortList[i].sPath === sPath) {
						return i;
					}
				}
				return -1;
			};
			this.removeGrouping = function() {
				oGrouper = null;
				bGroupingChanged = true;
			};
			this.getGrouping = function() {
				return oGrouper;
			};
			this.getSorter = function() {
				return aSortList;
			};
			this.resetFilters = function() {
				aFilterList.length = 0;
				oFilterDict = {};
				bFilterChanged = true;
			};
			this.addFilter = function(oFilter, sFilterAttribute) {
				if (oFilterDict[sFilterAttribute]) {
					// there is already at least one filter for this attribute -> add the new filter to the list
					oFilterDict[sFilterAttribute].push(oFilter);
				} else {
					// there is no filter for this attribute yet -> add the new filter attribute to the dictionary
					oFilterDict[sFilterAttribute] = [oFilter];
				}
				// now build the filter list - filters referring to the same attribute are connected by OR all
				// other filters are connected by AND (-> the default filter setting)
				aFilterList.length = 0;
				for (var prop in oFilterDict) {
					if (oFilterDict[prop].length > 1) {
						aFilterList.push(new Filter(oFilterDict[prop], false));
					} else {
						aFilterList.push(oFilterDict[prop][0]);
					}
				}
				bFilterChanged = true;
			};

			this.getFilterTable = function() {
				return (aFilterList && aFilterList.length > 0) ? aFilterList : null;
			};

			this.setSearchTerm = function(sNewSearchTerm) {
				// Searching may be done in more than one column - therefore a filter for
				// each of the searchable columns has to be created
				aSearchFilter.length = 0;
				if (sNewSearchTerm) {
					sSearchTerm = sNewSearchTerm;
					for (var i = 0; i < aSearchableFields.length; i++) {
						aSearchFilter.push(new Filter(aSearchableFields[i], FilterOperator.Contains, sNewSearchTerm));
					}
				} else {
					//the search term is empty -> remove the search
					sSearchTerm = "";
					aSearchFilter.length = 0;
				}
				bSearchChanged = true;
			};

			this.getSearchTerm = function() {
				return sSearchTerm;
			};

			this.applyTableOperations = function() {
				// Here the binding of the table items is updated with the currently active sorters and filters.
				// It is assumed that all changes done by the user are immediately reflected in the table.
				// That means there is always just one change at a time.
				var aActiveSorters = [],
					aActiveFilters = [],
					oTableBinding = oTable.getBinding("items");

				if (oTableBinding) {
					if (bGroupingChanged || bSortChanged) {
						// The grouping or sorting of the table has changed. The sorting on the binding needs to be updated.
						// Note that the sorter of the grouping has to be the first one in the list of sorters that is added
						// to the binding
						if (oGrouper) {
							aActiveSorters.push(oGrouper);
						}
						if (aSortList.length > 0) {
							aActiveSorters = aActiveSorters.concat(aSortList);
						}
						oTableBinding.sort(aActiveSorters);
					}
					if (bSearchChanged || bFilterChanged) {
						//the filters that origin from entries in a sarch field and the ones that are set e.g. by a
						// filter bar need to be applied together.
						// Note that if the search is done in more than one column then the corresponding filters have
						// to be connected using "or". All other filters are connected using "and" logic.

						if (aSearchFilter.length > 0) {
							aActiveFilters.push(new Filter(aSearchFilter, false));
						}
						if (aFilterList.length > 0) {
							aActiveFilters.push(new Filter(aFilterList, true));
						}
						oTableBinding.filter(aActiveFilters.length > 0 && new Filter(aActiveFilters, true));
					}
					this._resetChangeIndicators();
				}
			};
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/controller/messages.js":function(){sap.ui.define([
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"./utilities"
], function(MessageBox, JSONModel, utilities) {
	"use strict";

	function fnExtractErrorMessageFromDetails(sDetails) {
		if (jQuery.sap.startsWith(sDetails || "", "{\"error\":")) {
			var oErrModel = new JSONModel();
			oErrModel.setJSON(sDetails);
			return oErrModel.getProperty("/error/message/value") || "Error";
		}
	}

	function fnParseError(oParameter) {
		var oParameters = null,
			oResponse = null,
			oError = {};

		// "getParameters": for the case of catching oDataModel "requestFailed" event
		oParameters = oParameter.getParameters ? oParameter.getParameters() : null;
		// "oParameters.response": V2 interface, response object is under the getParameters()
		// "oParameters": V1 interface, response is directly in the getParameters()
		// "oParameter" for the case of catching request "onError" event
		oResponse = oParameters ? (oParameters.response || oParameters) : oParameter;
		oError.sDetails = oResponse.responseText || oResponse.body || (oResponse.response && oResponse.response.body) || ""; //"onError" Event: V1 uses response and response.body
		oError.sMessage = fnExtractErrorMessageFromDetails(oError.sDetails) || oResponse.message || (oParameters && oParameters.message);
		return oError;
	}

	function fnShowMessageBox(sTitle, sMessageHeader, sMessageDetails) {

		MessageBox.show(sMessageHeader, {
			icon: MessageBox.Icon.ERROR,
			title: sTitle,
			details: sMessageDetails,
			actions: MessageBox.Action.CLOSE,
			styleClass: utilities.getContentDensityClass()
		});

	}

	return {
		// Show an error dialog with information from the oData response object.
		// oParameter - The object containing error information
		showErrorMessage: function(oParameter, oView) {
			var oErrorDetails = fnParseError(oParameter),
				oBundle = oView.getModel("i18n").getResourceBundle(),
				sTitle = oBundle.getText("xtit.error");
			fnShowMessageBox(sTitle, oErrorDetails.sMessage, oErrorDetails);
			/*
			MessageBox.show(oErrorDetails.sMessage, {
				icon: MessageBox.Icon.ERROR,
				title: sTitle,
				details: oErrorDetails.sDetails,
				actions: MessageBox.Action.CLOSE,
				styleClass: utilities.getContentDensityClass()
			});*/
		},

		showXMLErrorMessage: function(oParameter, oView) {
			// Errors from upload control are in xml format as default because the requests expect other formats 
			// in the header for pictures

			// xml is parsed using jQuery, then passed to jQuery object
			try {
				var xmlDoc = jQuery.parseXML(oParameter);
				var xml = jQuery(xmlDoc);
			} catch (e) {
				jQuery.sap.log.error(e);
			}

			if (xml) {
				var sMessageHeader = xml.find("errordetails").find("message").text();
				var sMessageDetails = xml.find("error").find("message").text();
			} else {
				// Just in case that the Error from request could not be parsed
				sMessageHeader = oParameter;
			}

			var oBundle = oView.getModel("i18n").getResourceBundle(),
				sTitle = oBundle.getText("xtit.error");
			fnShowMessageBox(sTitle, sMessageHeader, sMessageDetails);
		},

		getErrorContent: function(oParameter) {
			return fnParseError(oParameter).sMessage;
		},

		getErrorDetails: function(oParameter) {
			return fnParseError(oParameter).sDetails;
		},

		extractErrorMessageFromDetails: function(sDetails) {
			return fnExtractErrorMessageFromDetails(sDetails);
		}
	};
});
},
	"nw/epm/refapps/ext/prod/manage/controller/utilities.js":function(){sap.ui.define([
	"sap/ui/Device"
], function(Device) {
	"use strict";

	// class providing static utility methods.

	// the densitiy class that should be used according to the device
	var sContentDensityClass = Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact";

	return {
		// provide the density class that should be used according to the device type 
		getContentDensityClass: function() {
			return sContentDensityClass;
		},

		// defines a dependency from oControl to oView
		attachControlToView: function(oView, oControl) {
			jQuery.sap.syncStyleClass(sContentDensityClass, oView, oControl);
			oView.addDependent(oControl);
		}
	};
});
},
	"nw/epm/refapps/ext/prod/manage/i18n/i18n.properties":'# Fiori Reference Application Manage Products based on Enterprise Procurement Model\r\n# __ldi.translation.uuid=20e2fdd0-8202-11e4-b4a9-0800200c9a66\r\n\r\n#XTIT\r\nxtit.shellTitle=Manage Products\r\n#XTIT: title for the master section (when entries have been read)\r\nxtit.masterTitleWithNumber=Products ({0})\r\n#XTIT: title for the master section (as long as no entries have been read)\r\nxtit.masterTitleWithoutNumber=Products\r\n#XTIT: this is the title for the Product Detail screen\r\nxtit.product=Product\r\n#XTIT: this is the title for the Product Edit screen\r\nxtit.productEdit=Edit Product\r\n#XTIT: this is the title for the Product Add screen\r\nxtit.productNew=New Product\r\n#XTIT: Title in infoToolbar for Filters\r\nxtit.filterBy=Filtered by {0}\r\n#XTIT: Title in infoToolbar for Filters\r\nxtit.filterBy2=Filtered by {0} and {1}\r\n#XTIT: Title of General Information Area\r\nxtit.generalInfo=General Information\r\n#XTIT: Title of Technical Data Area\r\nxtit.techData=Technical Data\r\n#XTIT: Title of confirmation dialog\r\nxtit.delete=Delete\r\n#XTIT: Title of the Error message box\r\nxtit.error=Error\r\n#XTIT: subject of email\r\nxtit.emailSubject=Product: {0}\r\n#XTIT: content field of email\r\nxtit.emailContent=Product ID: {0}\\nDescription: {1}\\nSupplier: {2}\r\n#XTIT:Title of Tile\r\nxtit.saveAsTile=Product\r\n#XTIT: Title of the Warning message box\r\nxtit.warning=Warning\r\n#XTIT: Title of the Error message box\r\nxtit.error=Error\r\n#XTIT: Title of confirmation dialog\r\nxtit.unsavedDraft=Unsaved Draft\r\n#XTIT: Title of the Supplier Card\r\nxtit.supplier=Supplier\r\n#XTIT: Title of error popup\r\nxtit.errorMetadataTitle=Metatdata error\r\n\r\n#XBUT: Delete Button\r\nxbut.delete=Delete\r\n#XBUT\r\nxbut.sort=Sort\r\n#XBUT\r\nxbut.group=Group\r\n#XBUT\r\nxbut.filter=Filter\r\n#XBUT: Edit Button\r\nxbut.edit=Edit\r\n#XBUT: Copy Button\r\nxbut.copy=Copy\r\n#XBUT: Email Button\r\nxbut.email=Send Email\r\n#XBUT:\r\nxbut.save=Save\r\n#XBUT:\r\nxbut.cancel=Cancel\r\n#XBUT: Resume button\r\nxbut.resume=Resume\r\n#XBUT: Discard button\r\nxbut.discard=Discard\r\n#XBUT: Leave Page\r\nxbut.leavePage=Leave Page\r\n#XBUT: Add new Product\r\nxbut.add=Add new Product\r\n\r\n#XFLD: Sort/Group/Filter by Availabilty Option\r\nxfld.availability=Availability\r\n#XFLD: Text for Grouping: Price between\r\nxfld.groupPriceBetween=Price between {0}\r\n#XFLD: Text for Grouping: Price greater \r\nxfld.groupPrice=Price\\: Over {0}\r\n#XFLD: Label for In Stock availability\r\nxfld.instock=In Stock\r\n#XFLD: Label for Out of Stock availability\r\nxfld.outstock=Out of Stock\r\n#XFLD: Label for restricted Stock availability\r\nxfld.restricted10=Less than 10 Left\r\n#XFLD: Text for Grouping: Category\r\nxfld.groupingLabel={0}\\: {1}\r\n#XFLD: Label for In Stock availability\r\nxfld.instock=In Stock\r\n#XFLD: Label for Out of Stock availability\r\nxfld.outstock=Out of Stock\r\n#XFLD: Label for restricted Stock availability\r\nxfld.restricted10=Less than 10 Left\r\n#XFLD: Label for Reviews\r\nxfld.reviews=Reviews\r\n#XLFD: Concatenate value and unit\r\nxfld.textConcat={0} / {1}\r\n#XFLD: Unit of Measurement\r\nxfld.uoM=Unit of Measurement\r\n\r\n\r\n#YMSG: Message text for deleting one Product\r\nymsg.deleteText=The Product {0} will be deleted\r\n#YMSG: Message text for deleting more then one Product\r\nymsg.deleteProducts={0} products will be deleted\r\n#YMSG: Success message for deleting more then one Product items\r\nymsg.deleteMultipleSuccess={0} products have been deleted\r\n#YMSG: Error message for deleting more then one Product items\r\nymsg.deleteNProductsFailed={0} products cannot be deleted\r\n#YMSG: Success message for deleting  one Product items\r\nymsg.deleteSuccess={0} has been deleted\r\n#YMSG:\r\nymsg.productUnavailable=The product with id {0} is not available (anymore)\r\n#YMSG:\r\nymsg.noProducts=No products available\r\n#YMSG:\r\nymsg.noAttachments=No attachments available\r\n#YMSG: Text for confirmation\r\nymsg.warningConfirm=Your entries will be lost when you leave this page\r\n#YMSG: Ask if the user wants to continue editing the product\r\nymsg.editDraft=You started editing product "{0}" on {1}. Do you want to resume editing or discard your changes?\r\n#YMSG: Ask if the user wants to continue editing a new product\r\nymsg.editNewDraft=You started creating a new product on {0}. Do you want to resume editing or discard your changes?\r\n#YMSG: Need to enter product name\r\nymsg.errorName=Enter the product name\r\n#YMSG: Need to enter supplier name\r\nymsg.errorSupplier=Enter the supplier name\r\n#YMSG: Need to enter category name\r\nymsg.errorMainCategory=Enter the main category name\r\n#YMSG: Need to enter subcategory name\r\nymsg.errorSubCategory=Enter the category name\r\n#YMSG: Need to enter description\r\nymsg.errorDescription=Enter the product description\r\n#YMSG: Need to enter price\r\nymsg.errorPrice=Enter the price\r\n#YMSG: Need to enter currency\r\nymsg.errorCurrency=Enter the currency\r\n#YMSG: Need to enter quantity unit\r\nymsg.errorQuantityUnit=Enter the quantity unit\r\n#YMSG: Need to enter weight \r\nymsg.errorWeightMeasure=Enter the weight\r\n#YMSG: Need to enter dimension\r\nymsg.errorDimension=Enter the dimension\r\n#YMSG: Confirmation of saving of product item\r\nymsg.saveText=Your changes to \\u0022{0}\\u0022 have been saved\r\n#YMSG: No products are available after search\r\nymsg.noDataAfterSerach=No matching products found\r\n#YMSG: No data indicator in case of technical problems\r\nymsg.noDataTechnicalProblems=Technical problems\r\n#YMSG: Image file type mismatch\r\nymsg.fileTypeMismatch=The file type \\u0022{0}\\u0022 is not accepted\r\n#YMSG: The security token cannot be retrieved\r\nymsg.securityTokenNotRetrieved=Your file could not be uploaded because of a security issue\r\n#YMSG: Message for "Page not found" screen\r\nymsg.pageNotFound=Please check your URL and try again\r\n#YMSG: Metadata error dialog description\r\nymsg.errorText=Sorry, a technical error occurred! Please try again later.\r\n#XFLD: Formatter for Value{0} and Unit {1}\r\nxfld.formatMeasure={0} {1}\r\n\r\n# Supplier card\r\n#XTIT\r\nxtit.contactDetails=Contact Details\r\n#XTIT\r\nxtit.mainContact= Main Contact',
	"nw/epm/refapps/ext/prod/manage/i18n/i18n_en.properties":'\n#XTIT\nxtit.shellTitle=Manage Products\n#XTIT: title for the master section (when entries have been read)\nxtit.masterTitleWithNumber=Products ({0})\n#XTIT: title for the master section (as long as no entries have been read)\nxtit.masterTitleWithoutNumber=Products\n#XTIT: this is the title for the Product Detail screen\nxtit.product=Product\n#XTIT: this is the title for the Product Edit screen\nxtit.productEdit=Edit Product\n#XTIT: this is the title for the Product Add screen\nxtit.productNew=New Product\n#XTIT: Title in infoToolbar for Filters\nxtit.filterBy=Filtered by {0}\n#XTIT: Title in infoToolbar for Filters\nxtit.filterBy2=Filtered by {0} and {1}\n#XTIT: Title of General Information Area\nxtit.generalInfo=General Information\n#XTIT: Title of Technical Data Area\nxtit.techData=Technical Data\n#XTIT: Title of confirmation dialog\nxtit.delete=Delete\n#XTIT: Title of the Error message box\nxtit.error=Error\n#XTIT: subject of email\nxtit.emailSubject=Product\\: {0}\n#XTIT: content field of email\nxtit.emailContent=Product ID\\: {0}\\nDescription\\: {1}\\nSupplier\\: {2}\n#XTIT:Title of Tile\nxtit.saveAsTile=Product\n#XTIT: Title of the Warning message box\nxtit.warning=Warning\n#XTIT: Title of the Error message box\nxtit.error=Error\n#XTIT: Title of confirmation dialog\nxtit.unsavedDraft=Unsaved Draft\n#XTIT: Title of the Supplier Card\nxtit.supplier=Supplier\n#XTIT: Title of error popup\nxtit.errorMetadataTitle=Error\n\n#XBUT: Delete Button\nxbut.delete=Delete\n#XBUT\nxbut.sort=Sort\n#XBUT\nxbut.group=Group\n#XBUT\nxbut.filter=Filter\n#XBUT: Edit Button\nxbut.edit=Edit\n#XBUT: Copy Button\nxbut.copy=Copy\n#XBUT: Email Button\nxbut.email=Send Email\n#XBUT:\nxbut.save=Save\n#XBUT:\nxbut.cancel=Cancel\n#XBUT: Resume button\nxbut.resume=Resume\n#XBUT: Discard button\nxbut.discard=Discard\n#XBUT: Leave Page\nxbut.leavePage=Leave Page\n#XBUT: Add new Product\nxbut.add=New Product\n\n#XFLD: Sort/Group/Filter by Availabilty Option\nxfld.availability=Availability\n#XFLD: Text for Grouping: Price between\nxfld.groupPriceBetween=Price between {0}\n#XFLD: Text for Grouping: Price greater \nxfld.groupPrice=Price\\: Over {0}\n#XFLD: Label for In Stock availability\nxfld.instock=In Stock\n#XFLD: Label for Out of Stock availability\nxfld.outstock=Out of Stock\n#XFLD: Label for restricted Stock availability\nxfld.restricted10=Less than 10 Left\n#XFLD: Text for Grouping: Category\nxfld.groupingLabel={0}\\: {1}\n#XFLD: Label for In Stock availability\nxfld.instock=In Stock\n#XFLD: Label for Out of Stock availability\nxfld.outstock=Out of Stock\n#XFLD: Label for restricted Stock availability\nxfld.restricted10=Less Than 10 Left\n#XFLD: Label for Reviews\nxfld.reviews=Reviews\n#XLFD: Concatenate value and unit\nxfld.textConcat={0} / {1}\n#XFLD: Unit of Measurement\nxfld.uoM=Unit of Measurement\n\n\n#YMSG: Message text for deleting one Product\nymsg.deleteText=Product {0} will be deleted\n#YMSG: Message text for deleting more then one Product\nymsg.deleteProducts={0} products will be deleted\n#YMSG: Success message for deleting more then one Product items\nymsg.deleteMultipleSuccess={0} products have been deleted\n#YMSG: Error message for deleting more then one Product items\nymsg.deleteNProductsFailed={0} products cannot be deleted\n#YMSG: Success message for deleting  one Product items\nymsg.deleteSuccess={0} has been deleted\n#YMSG:\nymsg.productUnavailable=The product with the ID {0} is no longer available\n#YMSG:\nymsg.noProducts=No products available\n#YMSG:\nymsg.noAttachments=No attachments available\n#YMSG: Text for confirmation\nymsg.warningConfirm=Your entries will be lost when you leave this page.\n#YMSG: Ask if the user wants to continue editing the product\nymsg.editDraft=You started editing product "{0}" on {1}. Do you want to resume editing or discard your changes?\n#YMSG: Ask if the user wants to continue editing a new product\nymsg.editNewDraft=You started creating a new product on {0}. Do you want to resume editing or discard your changes?\n#YMSG: Need to enter product name\nymsg.errorName=Enter the product name\n#YMSG: Need to enter supplier name\nymsg.errorSupplier=Enter the supplier\n#YMSG: Need to enter category name\nymsg.errorMainCategory=Select a main category\n#YMSG: Need to enter subcategory name\nymsg.errorSubCategory=Select a category\n#YMSG: Need to enter description\nymsg.errorDescription=Enter a product description\n#YMSG: Need to enter price\nymsg.errorPrice=Enter the price\n#YMSG: Need to enter currency\nymsg.errorCurrency=Enter a currency\n#YMSG: Need to enter quantity unit\nymsg.errorQuantityUnit=Enter the unit of measure\n#YMSG: Need to enter weight \nymsg.errorWeightMeasure=Enter the weight\n#YMSG: Need to enter dimension\nymsg.errorDimension=Enter the dimensions\n#YMSG: Confirmation of saving of product item\nymsg.saveText=Your changes to "{0}" have been saved\n#YMSG: No products are available after search\nymsg.noDataAfterSerach=No matching products found\n#YMSG: No data indicator in case of technical problems\nymsg.noDataTechnicalProblems=Unable to retrieve products\n#YMSG: Image file type mismatch\nymsg.fileTypeMismatch=File type "{0}" is not supported\n#YMSG: The security token cannot be retrieved\nymsg.securityTokenNotRetrieved=Your file could not be uploaded because of a security issue.\n#YMSG: Message for "Page not found" screen\nymsg.pageNotFound=Please check your URL and try again.\n#YMSG: Metadata error dialog description\nymsg.errorText=Sorry, a technical error occurred. Please try again later.\n#XFLD: Formatter for Value{0} and Unit {1}\nxfld.formatMeasure={0} {1}\n\n# Supplier card\n#XTIT\nxtit.contactDetails=Contact Details\n#XTIT\nxtit.mainContact=Main Contact\n',
	"nw/epm/refapps/ext/prod/manage/i18n/i18n_en_US_sappsd.properties":'\n#XTIT\nxtit.shellTitle=[[[\\u039C\\u0105\\u014B\\u0105\\u011F\\u0113 \\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: title for the master section (when entries have been read)\nxtit.masterTitleWithNumber=[[[\\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F ({0})]]]\n#XTIT: title for the master section (as long as no entries have been read)\nxtit.masterTitleWithoutNumber=[[[\\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: this is the title for the Product Detail screen\nxtit.product=[[[\\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: this is the title for the Product Edit screen\nxtit.productEdit=[[[\\u0114\\u018C\\u012F\\u0163 \\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: this is the title for the Product Add screen\nxtit.productNew=[[[\\u0143\\u0113\\u0175 \\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title in infoToolbar for Filters\nxtit.filterBy=[[[\\u0191\\u012F\\u013A\\u0163\\u0113\\u0157\\u0113\\u018C \\u0183\\u0177 {0}]]]\n#XTIT: Title in infoToolbar for Filters\nxtit.filterBy2=[[[\\u0191\\u012F\\u013A\\u0163\\u0113\\u0157\\u0113\\u018C \\u0183\\u0177 {0} \\u0105\\u014B\\u018C {1}]]]\n#XTIT: Title of General Information Area\nxtit.generalInfo=[[[\\u0122\\u0113\\u014B\\u0113\\u0157\\u0105\\u013A \\u012C\\u014B\\u0192\\u014F\\u0157\\u0271\\u0105\\u0163\\u012F\\u014F\\u014B\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of Technical Data Area\nxtit.techData=[[[\\u0162\\u0113\\u010B\\u0125\\u014B\\u012F\\u010B\\u0105\\u013A \\u010E\\u0105\\u0163\\u0105\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of confirmation dialog\nxtit.delete=[[[\\u010E\\u0113\\u013A\\u0113\\u0163\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of the Error message box\nxtit.error=Error\n#XTIT: subject of email\nxtit.emailSubject=[[[\\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\: {0}]]]\n#XTIT: content field of email\nxtit.emailContent=[[[\\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 \\u012C\\u010E\\: {0}\\n\\u010E\\u0113\\u015F\\u010B\\u0157\\u012F\\u03C1\\u0163\\u012F\\u014F\\u014B\\: {1}\\n\\u015C\\u0171\\u03C1\\u03C1\\u013A\\u012F\\u0113\\u0157\\: {2}]]]\n#XTIT:Title of Tile\nxtit.saveAsTile=[[[\\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of the Warning message box\nxtit.warning=[[[\\u0174\\u0105\\u0157\\u014B\\u012F\\u014B\\u011F\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of the Error message box\nxtit.error=[[[\\u0114\\u0157\\u0157\\u014F\\u0157\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of confirmation dialog\nxtit.unsavedDraft=[[[\\u016E\\u014B\\u015F\\u0105\\u028B\\u0113\\u018C \\u010E\\u0157\\u0105\\u0192\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of the Supplier Card\nxtit.supplier=[[[\\u015C\\u0171\\u03C1\\u03C1\\u013A\\u012F\\u0113\\u0157\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT: Title of error popup\nxtit.errorMetadataTitle=[[[\\u039C\\u0113\\u0163\\u0105\\u0163\\u018C\\u0105\\u0163\\u0105 \\u0113\\u0157\\u0157\\u014F\\u0157\\u2219\\u2219\\u2219\\u2219]]]\n\n#XBUT: Delete Button\nxbut.delete=[[[\\u010E\\u0113\\u013A\\u0113\\u0163\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT\nxbut.sort=[[[\\u015C\\u014F\\u0157\\u0163]]]\n#XBUT\nxbut.group=[[[\\u0122\\u0157\\u014F\\u0171\\u03C1\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT\nxbut.filter=[[[\\u0191\\u012F\\u013A\\u0163\\u0113\\u0157\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT: Edit Button\nxbut.edit=[[[\\u0114\\u018C\\u012F\\u0163]]]\n#XBUT: Copy Button\nxbut.copy=[[[\\u0108\\u014F\\u03C1\\u0177]]]\n#XBUT: Email Button\nxbut.email=[[[\\u015C\\u0113\\u014B\\u018C \\u0114\\u0271\\u0105\\u012F\\u013A\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT:\nxbut.save=[[[\\u015C\\u0105\\u028B\\u0113]]]\n#XBUT:\nxbut.cancel=[[[\\u0108\\u0105\\u014B\\u010B\\u0113\\u013A\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT: Resume button\nxbut.resume=[[[\\u0158\\u0113\\u015F\\u0171\\u0271\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT: Discard button\nxbut.discard=[[[\\u010E\\u012F\\u015F\\u010B\\u0105\\u0157\\u018C\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT: Leave Page\nxbut.leavePage=[[[\\u013B\\u0113\\u0105\\u028B\\u0113 \\u01A4\\u0105\\u011F\\u0113\\u2219\\u2219\\u2219\\u2219]]]\n#XBUT: Add new Product\nxbut.add=[[[\\u0100\\u018C\\u018C \\u014B\\u0113\\u0175 \\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u2219\\u2219\\u2219\\u2219]]]\n\n#XFLD: Sort/Group/Filter by Availabilty Option\nxfld.availability=[[[\\u0100\\u028B\\u0105\\u012F\\u013A\\u0105\\u0183\\u012F\\u013A\\u012F\\u0163\\u0177\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XFLD: Text for Grouping: Price between\nxfld.groupPriceBetween=[[[\\u01A4\\u0157\\u012F\\u010B\\u0113 \\u0183\\u0113\\u0163\\u0175\\u0113\\u0113\\u014B {0}]]]\n#XFLD: Text for Grouping: Price greater \nxfld.groupPrice=[[[\\u01A4\\u0157\\u012F\\u010B\\u0113\\: \\u014E\\u028B\\u0113\\u0157 {0}]]]\n#XFLD: Label for In Stock availability\nxfld.instock=In Stock\n#XFLD: Label for Out of Stock availability\nxfld.outstock=Out of Stock\n#XFLD: Label for restricted Stock availability\nxfld.restricted10=Less than 10 Left\n#XFLD: Text for Grouping: Category\nxfld.groupingLabel=[[[{0}\\: {1}]]]\n#XFLD: Label for In Stock availability\nxfld.instock=[[[\\u012C\\u014B \\u015C\\u0163\\u014F\\u010B\\u0137\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XFLD: Label for Out of Stock availability\nxfld.outstock=[[[\\u014E\\u0171\\u0163 \\u014F\\u0192 \\u015C\\u0163\\u014F\\u010B\\u0137\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XFLD: Label for restricted Stock availability\nxfld.restricted10=[[[\\u013B\\u0113\\u015F\\u015F \\u0163\\u0125\\u0105\\u014B 10 \\u013B\\u0113\\u0192\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XFLD: Label for Reviews\nxfld.reviews=[[[\\u0158\\u0113\\u028B\\u012F\\u0113\\u0175\\u015F\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XLFD: Concatenate value and unit\nxfld.textConcat=[[[{0} / {1}]]]\n#XFLD: Unit of Measurement\nxfld.uoM=[[[\\u016E\\u014B\\u012F\\u0163 \\u014F\\u0192 \\u039C\\u0113\\u0105\\u015F\\u0171\\u0157\\u0113\\u0271\\u0113\\u014B\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n\n\n#YMSG: Message text for deleting one Product\nymsg.deleteText=[[[\\u0162\\u0125\\u0113 \\u01A4\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 {0} \\u0175\\u012F\\u013A\\u013A \\u0183\\u0113 \\u018C\\u0113\\u013A\\u0113\\u0163\\u0113\\u018C]]]\n#YMSG: Message text for deleting more then one Product\nymsg.deleteProducts=[[[{0} \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F \\u0175\\u012F\\u013A\\u013A \\u0183\\u0113 \\u018C\\u0113\\u013A\\u0113\\u0163\\u0113\\u018C]]]\n#YMSG: Success message for deleting more then one Product items\nymsg.deleteMultipleSuccess=[[[{0} \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F \\u0125\\u0105\\u028B\\u0113 \\u0183\\u0113\\u0113\\u014B \\u018C\\u0113\\u013A\\u0113\\u0163\\u0113\\u018C]]]\n#YMSG: Error message for deleting more then one Product items\nymsg.deleteNProductsFailed=[[[{0} \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F \\u010B\\u0105\\u014B\\u014B\\u014F\\u0163 \\u0183\\u0113 \\u018C\\u0113\\u013A\\u0113\\u0163\\u0113\\u018C]]]\n#YMSG: Success message for deleting  one Product items\nymsg.deleteSuccess=[[[{0} \\u0125\\u0105\\u015F \\u0183\\u0113\\u0113\\u014B \\u018C\\u0113\\u013A\\u0113\\u0163\\u0113\\u018C]]]\n#YMSG:\nymsg.productUnavailable=[[[\\u0162\\u0125\\u0113 \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 \\u0175\\u012F\\u0163\\u0125 \\u012F\\u018C {0} \\u012F\\u015F \\u014B\\u014F\\u0163 \\u0105\\u028B\\u0105\\u012F\\u013A\\u0105\\u0183\\u013A\\u0113 (\\u0105\\u014B\\u0177\\u0271\\u014F\\u0157\\u0113)]]]\n#YMSG:\nymsg.noProducts=[[[\\u0143\\u014F \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F \\u0105\\u028B\\u0105\\u012F\\u013A\\u0105\\u0183\\u013A\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG:\nymsg.noAttachments=[[[\\u0143\\u014F \\u0105\\u0163\\u0163\\u0105\\u010B\\u0125\\u0271\\u0113\\u014B\\u0163\\u015F \\u0105\\u028B\\u0105\\u012F\\u013A\\u0105\\u0183\\u013A\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Text for confirmation\nymsg.warningConfirm=[[[\\u0176\\u014F\\u0171\\u0157 \\u0113\\u014B\\u0163\\u0157\\u012F\\u0113\\u015F \\u0175\\u012F\\u013A\\u013A \\u0183\\u0113 \\u013A\\u014F\\u015F\\u0163 \\u0175\\u0125\\u0113\\u014B \\u0177\\u014F\\u0171 \\u013A\\u0113\\u0105\\u028B\\u0113 \\u0163\\u0125\\u012F\\u015F \\u03C1\\u0105\\u011F\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Ask if the user wants to continue editing the product\nymsg.editDraft=[[[\\u0176\\u014F\\u0171 \\u015F\\u0163\\u0105\\u0157\\u0163\\u0113\\u018C \\u0113\\u018C\\u012F\\u0163\\u012F\\u014B\\u011F \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 "{0}" \\u014F\\u014B {1}. \\u010E\\u014F \\u0177\\u014F\\u0171 \\u0175\\u0105\\u014B\\u0163 \\u0163\\u014F \\u0157\\u0113\\u015F\\u0171\\u0271\\u0113 \\u0113\\u018C\\u012F\\u0163\\u012F\\u014B\\u011F \\u014F\\u0157 \\u018C\\u012F\\u015F\\u010B\\u0105\\u0157\\u018C \\u0177\\u014F\\u0171\\u0157 \\u010B\\u0125\\u0105\\u014B\\u011F\\u0113\\u015F?]]]\n#YMSG: Ask if the user wants to continue editing a new product\nymsg.editNewDraft=[[[\\u0176\\u014F\\u0171 \\u015F\\u0163\\u0105\\u0157\\u0163\\u0113\\u018C \\u010B\\u0157\\u0113\\u0105\\u0163\\u012F\\u014B\\u011F \\u0105 \\u014B\\u0113\\u0175 \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 \\u014F\\u014B {0}. \\u010E\\u014F \\u0177\\u014F\\u0171 \\u0175\\u0105\\u014B\\u0163 \\u0163\\u014F \\u0157\\u0113\\u015F\\u0171\\u0271\\u0113 \\u0113\\u018C\\u012F\\u0163\\u012F\\u014B\\u011F \\u014F\\u0157 \\u018C\\u012F\\u015F\\u010B\\u0105\\u0157\\u018C \\u0177\\u014F\\u0171\\u0157 \\u010B\\u0125\\u0105\\u014B\\u011F\\u0113\\u015F?]]]\n#YMSG: Need to enter product name\nymsg.errorName=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 \\u014B\\u0105\\u0271\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter supplier name\nymsg.errorSupplier=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u015F\\u0171\\u03C1\\u03C1\\u013A\\u012F\\u0113\\u0157 \\u014B\\u0105\\u0271\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter category name\nymsg.errorMainCategory=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u0271\\u0105\\u012F\\u014B \\u010B\\u0105\\u0163\\u0113\\u011F\\u014F\\u0157\\u0177 \\u014B\\u0105\\u0271\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter subcategory name\nymsg.errorSubCategory=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u010B\\u0105\\u0163\\u0113\\u011F\\u014F\\u0157\\u0177 \\u014B\\u0105\\u0271\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter description\nymsg.errorDescription=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163 \\u018C\\u0113\\u015F\\u010B\\u0157\\u012F\\u03C1\\u0163\\u012F\\u014F\\u014B\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter price\nymsg.errorPrice=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u03C1\\u0157\\u012F\\u010B\\u0113\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter currency\nymsg.errorCurrency=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u010B\\u0171\\u0157\\u0157\\u0113\\u014B\\u010B\\u0177\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter quantity unit\nymsg.errorQuantityUnit=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u01A3\\u0171\\u0105\\u014B\\u0163\\u012F\\u0163\\u0177 \\u0171\\u014B\\u012F\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter weight \nymsg.errorWeightMeasure=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u0175\\u0113\\u012F\\u011F\\u0125\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Need to enter dimension\nymsg.errorDimension=[[[\\u0114\\u014B\\u0163\\u0113\\u0157 \\u0163\\u0125\\u0113 \\u018C\\u012F\\u0271\\u0113\\u014B\\u015F\\u012F\\u014F\\u014B\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Confirmation of saving of product item\nymsg.saveText=[[[\\u0176\\u014F\\u0171\\u0157 \\u010B\\u0125\\u0105\\u014B\\u011F\\u0113\\u015F \\u0163\\u014F "{0}" \\u0125\\u0105\\u028B\\u0113 \\u0183\\u0113\\u0113\\u014B \\u015F\\u0105\\u028B\\u0113\\u018C]]]\n#YMSG: No products are available after search\nymsg.noDataAfterSerach=[[[\\u0143\\u014F \\u0271\\u0105\\u0163\\u010B\\u0125\\u012F\\u014B\\u011F \\u03C1\\u0157\\u014F\\u018C\\u0171\\u010B\\u0163\\u015F \\u0192\\u014F\\u0171\\u014B\\u018C\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: No data indicator in case of technical problems\nymsg.noDataTechnicalProblems=[[[\\u0162\\u0113\\u010B\\u0125\\u014B\\u012F\\u010B\\u0105\\u013A \\u03C1\\u0157\\u014F\\u0183\\u013A\\u0113\\u0271\\u015F\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Image file type mismatch\nymsg.fileTypeMismatch=[[[\\u0162\\u0125\\u0113 \\u0192\\u012F\\u013A\\u0113 \\u0163\\u0177\\u03C1\\u0113 "{0}" \\u012F\\u015F \\u014B\\u014F\\u0163 \\u0105\\u010B\\u010B\\u0113\\u03C1\\u0163\\u0113\\u018C]]]\n#YMSG: The security token cannot be retrieved\nymsg.securityTokenNotRetrieved=[[[\\u0176\\u014F\\u0171\\u0157 \\u0192\\u012F\\u013A\\u0113 \\u010B\\u014F\\u0171\\u013A\\u018C \\u014B\\u014F\\u0163 \\u0183\\u0113 \\u0171\\u03C1\\u013A\\u014F\\u0105\\u018C\\u0113\\u018C \\u0183\\u0113\\u010B\\u0105\\u0171\\u015F\\u0113 \\u014F\\u0192 \\u0105 \\u015F\\u0113\\u010B\\u0171\\u0157\\u012F\\u0163\\u0177 \\u012F\\u015F\\u015F\\u0171\\u0113\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Message for "Page not found" screen\nymsg.pageNotFound=[[[\\u01A4\\u013A\\u0113\\u0105\\u015F\\u0113 \\u010B\\u0125\\u0113\\u010B\\u0137 \\u0177\\u014F\\u0171\\u0157 \\u016E\\u0158\\u013B \\u0105\\u014B\\u018C \\u0163\\u0157\\u0177 \\u0105\\u011F\\u0105\\u012F\\u014B\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#YMSG: Metadata error dialog description\nymsg.errorText=[[[\\u015C\\u014F\\u0157\\u0157\\u0177, \\u0105 \\u0163\\u0113\\u010B\\u0125\\u014B\\u012F\\u010B\\u0105\\u013A \\u0113\\u0157\\u0157\\u014F\\u0157 \\u014F\\u010B\\u010B\\u0171\\u0157\\u0157\\u0113\\u018C\\! \\u01A4\\u013A\\u0113\\u0105\\u015F\\u0113 \\u0163\\u0157\\u0177 \\u0105\\u011F\\u0105\\u012F\\u014B \\u013A\\u0105\\u0163\\u0113\\u0157.\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n#XFLD: Formatter for Value{0} and Unit {1}\nxfld.formatMeasure=[[[{0} {1}]]]\n\n# Supplier card\n#XTIT\nxtit.contactDetails=[[[\\u0108\\u014F\\u014B\\u0163\\u0105\\u010B\\u0163 \\u010E\\u0113\\u0163\\u0105\\u012F\\u013A\\u015F\\u2219\\u2219\\u2219\\u2219]]]\n#XTIT\nxtit.mainContact=[[[\\u039C\\u0105\\u012F\\u014B \\u0108\\u014F\\u014B\\u0163\\u0105\\u010B\\u0163\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219\\u2219]]]\n',
	"nw/epm/refapps/ext/prod/manage/i18n/i18n_en_US_saptrc.properties":'\n#XTIT\nxtit.shellTitle=o6QiMBhDXdJIztyURBNdDQ_Manage Products\n#XTIT: title for the master section (when entries have been read)\nxtit.masterTitleWithNumber=nS49ZTgJ/pttG0pC0wz/Uw_Products ({0})\n#XTIT: title for the master section (as long as no entries have been read)\nxtit.masterTitleWithoutNumber=UK2gvtlxgqZ9ni2mwFT7gw_Products\n#XTIT: this is the title for the Product Detail screen\nxtit.product=YZozySsWC/qMbjSb1YqGNw_Product\n#XTIT: this is the title for the Product Edit screen\nxtit.productEdit=l3hOnTa5/nCFVuoATPdJfw_Edit Product\n#XTIT: this is the title for the Product Add screen\nxtit.productNew=V1lF5tT9/cSoFc/L/K3xtQ_New Product\n#XTIT: Title in infoToolbar for Filters\nxtit.filterBy=u3iYgyORLv8I0vdX+Oh2LA_Filtered by {0}\n#XTIT: Title in infoToolbar for Filters\nxtit.filterBy2=IXJ6cxC8rdJ0MZn3P5eYrg_Filtered by {0} and {1}\n#XTIT: Title of General Information Area\nxtit.generalInfo=kLQT6f4RARZGvy3xQVPE8Q_General Information\n#XTIT: Title of Technical Data Area\nxtit.techData=K/3KJGSkK9BezOz8uDi+1Q_Technical Data\n#XTIT: Title of confirmation dialog\nxtit.delete=o/FevhIVbgP+L/4jm8brxg_Delete\n#XTIT: Title of the Error message box\nxtit.error=Error\n#XTIT: subject of email\nxtit.emailSubject=IrO0x+GoyuI8LbZopOCobA_Product\\: {0}\n#XTIT: content field of email\nxtit.emailContent=N8W8U4Zu3HVQHmu6GrSf2A_Product ID\\: {0}\\nDescription\\: {1}\\nSupplier\\: {2}\n#XTIT:Title of Tile\nxtit.saveAsTile=VQgVyoS+o0y59taOcwVOsA_Product\n#XTIT: Title of the Warning message box\nxtit.warning=gVOSw8C3Xsjssp50dG5o3A_Warning\n#XTIT: Title of the Error message box\nxtit.error=SeCIzQriaAIGlDt1khKbsg_Error\n#XTIT: Title of confirmation dialog\nxtit.unsavedDraft=tA3BKip9S3irvxzB2VUaTQ_Unsaved Draft\n#XTIT: Title of the Supplier Card\nxtit.supplier=6uk7YwRPtNWfOz5p6OYDvQ_Supplier\n#XTIT: Title of error popup\nxtit.errorMetadataTitle=9kjgmH/2KoQpX6xreroQ1A_Metatdata error\n\n#XBUT: Delete Button\nxbut.delete=LPTNu/0qKbWbj0H4vwu9lQ_Delete\n#XBUT\nxbut.sort=aRQXpRoWjJLOc7nVF3L3hw_Sort\n#XBUT\nxbut.group=rSzM5gXPvk0xJScfOJUi4A_Group\n#XBUT\nxbut.filter=8vMuz85o2Nu9P8dHUExGKQ_Filter\n#XBUT: Edit Button\nxbut.edit=3I/Mv/gSu3s5Cs4/aeMcjw_Edit\n#XBUT: Copy Button\nxbut.copy=FuwF60DWzLjHBYQMW1ZTgQ_Copy\n#XBUT: Email Button\nxbut.email=A9hZvyuU9kale00xmFRqHQ_Send Email\n#XBUT:\nxbut.save=uJAwcv+2txD3TBvS80JIQg_Save\n#XBUT:\nxbut.cancel=3emqlA/znSJrMRl0eRPgqw_Cancel\n#XBUT: Resume button\nxbut.resume=qUQs3XSxx8kuby4sYovU/Q_Resume\n#XBUT: Discard button\nxbut.discard=jJi1kova2EbXPFeDJbRujg_Discard\n#XBUT: Leave Page\nxbut.leavePage=fYdC6kkPibYEoZESJodCYg_Leave Page\n#XBUT: Add new Product\nxbut.add=Rjt1rugVQGFK6DGwrgTRjQ_Add new Product\n\n#XFLD: Sort/Group/Filter by Availabilty Option\nxfld.availability=gJ7YCr19uEiZ5L89PnspFQ_Availability\n#XFLD: Text for Grouping: Price between\nxfld.groupPriceBetween=v3a+Q6oXUs0A9TKNGa1Tpg_Price between {0}\n#XFLD: Text for Grouping: Price greater \nxfld.groupPrice=iyVHNchrvQCIUkTSPAJjjQ_Price\\: Over {0}\n#XFLD: Label for In Stock availability\nxfld.instock=In Stock\n#XFLD: Label for Out of Stock availability\nxfld.outstock=Out of Stock\n#XFLD: Label for restricted Stock availability\nxfld.restricted10=Less than 10 Left\n#XFLD: Text for Grouping: Category\nxfld.groupingLabel=ezBBxztuu65rMKIgy+/bwg_{0}\\: {1}\n#XFLD: Label for In Stock availability\nxfld.instock=auOuacDuTixAZRFgRqXViQ_In Stock\n#XFLD: Label for Out of Stock availability\nxfld.outstock=0DL/x6Rg5hsRTs+BgAI8Pg_Out of Stock\n#XFLD: Label for restricted Stock availability\nxfld.restricted10=XkwTYzw0L0+e4A/yYXkLag_Less than 10 Left\n#XFLD: Label for Reviews\nxfld.reviews=uoGHfzeAqd9yyjo8NscKhg_Reviews\n#XLFD: Concatenate value and unit\nxfld.textConcat=EjGlQPj5qUlJO4aUz8KGig_{0} / {1}\n#XFLD: Unit of Measurement\nxfld.uoM=zFYEwmN1T7DiT53Z+tDaHA_Unit of Measurement\n\n\n#YMSG: Message text for deleting one Product\nymsg.deleteText=H0opbdcckdavyDqMB74TUg_The Product {0} will be deleted\n#YMSG: Message text for deleting more then one Product\nymsg.deleteProducts=5FItZwEp6fxIMRftOvxU8w_{0} products will be deleted\n#YMSG: Success message for deleting more then one Product items\nymsg.deleteMultipleSuccess=jKE3q55sKtxjs1i/jFo5Cg_{0} products have been deleted\n#YMSG: Error message for deleting more then one Product items\nymsg.deleteNProductsFailed=gGy1VVuLeT9VzXQfhuwSVg_{0} products cannot be deleted\n#YMSG: Success message for deleting  one Product items\nymsg.deleteSuccess=dTcapvUBGoGj66govrI0Kg_{0} has been deleted\n#YMSG:\nymsg.productUnavailable=75b7TgRre2bp71JyrcODtw_The product with id {0} is not available (anymore)\n#YMSG:\nymsg.noProducts=Irtcoc5lFnzDPsMM2VM6ww_No products available\n#YMSG:\nymsg.noAttachments=lSibTrnkqJKeAzYgYsiwYQ_No attachments available\n#YMSG: Text for confirmation\nymsg.warningConfirm=FOr1K2gENSMmvxs9nP833A_Your entries will be lost when you leave this page\n#YMSG: Ask if the user wants to continue editing the product\nymsg.editDraft=8f9DJAivzjkkFJnrnFopDw_You started editing product "{0}" on {1}. Do you want to resume editing or discard your changes?\n#YMSG: Ask if the user wants to continue editing a new product\nymsg.editNewDraft=hMh4HZJSEIb5fbnolBxV4A_You started creating a new product on {0}. Do you want to resume editing or discard your changes?\n#YMSG: Need to enter product name\nymsg.errorName=96RQVP+gkBdjoVMJFL136g_Enter the product name\n#YMSG: Need to enter supplier name\nymsg.errorSupplier=hHNMRHZzb7ZJByOlWH5rOg_Enter the supplier name\n#YMSG: Need to enter category name\nymsg.errorMainCategory=EcGE9WTvTr8vLhbZY4TTlA_Enter the main category name\n#YMSG: Need to enter subcategory name\nymsg.errorSubCategory=6huGgETugSDGpSaRZDEDpg_Enter the category name\n#YMSG: Need to enter description\nymsg.errorDescription=ZSHxDT8eTi4b7AlEfpfQVA_Enter the product description\n#YMSG: Need to enter price\nymsg.errorPrice=kWsAJTcJ/BkwHqAMsj4Y5w_Enter the price\n#YMSG: Need to enter currency\nymsg.errorCurrency=ailJrmuzUHFkeg+KrDrmjA_Enter the currency\n#YMSG: Need to enter quantity unit\nymsg.errorQuantityUnit=nTeg7CNtGD+SGMUaURtalQ_Enter the quantity unit\n#YMSG: Need to enter weight \nymsg.errorWeightMeasure=M95NbUQ0GemVUOvoZkUqhQ_Enter the weight\n#YMSG: Need to enter dimension\nymsg.errorDimension=tZTMUY52RKDzeWF9S2ARdQ_Enter the dimension\n#YMSG: Confirmation of saving of product item\nymsg.saveText=QwcOVM1TPtIANOPKyLQidg_Your changes to "{0}" have been saved\n#YMSG: No products are available after search\nymsg.noDataAfterSerach=10Shr8s53+Vy+nlcqsZbWA_No matching products found\n#YMSG: No data indicator in case of technical problems\nymsg.noDataTechnicalProblems=ZWBifjTFx7kz32q6VDVBzg_Technical problems\n#YMSG: Image file type mismatch\nymsg.fileTypeMismatch=U6v6dA8WFBYT4tHi7qdVIA_The file type "{0}" is not accepted\n#YMSG: The security token cannot be retrieved\nymsg.securityTokenNotRetrieved=WAqzc8RhYIm7YOsTuNWijA_Your file could not be uploaded because of a security issue\n#YMSG: Message for "Page not found" screen\nymsg.pageNotFound=UqTqK4B+xE3iiUqoBPU1AQ_Please check your URL and try again\n#YMSG: Metadata error dialog description\nymsg.errorText=6nZdyrXIzsyjmZ8asMrMhA_Sorry, a technical error occurred\\! Please try again later.\n#XFLD: Formatter for Value{0} and Unit {1}\nxfld.formatMeasure=MA+5YO2OfxBSt0hVoyHPWQ_{0} {1}\n\n# Supplier card\n#XTIT\nxtit.contactDetails=SKFGlkRHiY6xtVySzjkd6g_Contact Details\n#XTIT\nxtit.mainContact=Cs1888JJOFb99VqcIZjKyA_Main Contact\n',
	"nw/epm/refapps/ext/prod/manage/localService/MockRequests.js":function(){// In mock mode, the mock server intercepts HTTP calls and provides fake output to the
// client without involving a backend system. But special backend logic, such as that
// performed by function imports, is not automatically known to the mock server. To handle
// such cases, the app needs to define specific mock requests that simulate the backend
// logic using standard HTTP requests (that are again interpreted by the mock server) as
// shown below.

// The mock requests object caontains three attributes.
// method -     This is the http method (e.g. POST, PUT, DELETE,...) to which the mock request refers.
//              It is one of two criterions used by the mock server to decide if a request is handled
//              by a certain mock request object.
// path -       This is a regular expression that is matched against the url of the current request.
//              It is the second criterion used by the mock server to decide if a request is handled
//              by a certain mock request object. Please note that using the (.*) for the url parameter
//              section in the pattern causes the mock server to extract the url parameters from the
//              URL and provide them as separate import parameters to the handler function.
// response -   This is the handler function that is called when a http request matches the "method"
//              and "path" attributes of the mock request. A XML http request object (oXhr) for the
//              matched request is provided as an import parameter and optionally there can be import
//              parameters for url parameters
//              Please note that handler function needs to create the same response object as the
//              life service would.

sap.ui.define(["sap/ui/base/Object"], function(Object) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.prod.manage.localService.MockRequests", {
		constructor: function(oMockServer) {
			this._iLastId = 0;
			this._oMockServer = oMockServer;
			if (this._oMockServer.attachAfter) { // adapts to mock server new interface from UI5 1.30
				this._oMockServer.attachAfter("POST", this.onAfterDraftCreated.bind(this), "ProductDrafts");
			}
			this._oNewDraftDefaultValues = {
				CurrencyCode: "EUR",
				DimensionUnit: "MTR",
				IsDirty: false,
				IsNewProduct: true,
				QuantityUnit: "EA",
				MeasureUnit: "each",
				WeightUnit: "KGM"
			};
		},

		getRequests: function() {
			// This method is called by the webIDE if the app is started in mock mode with the
			// option "AddCusom Mock Requests". It returns the list of app specific mock requests.
			// The list is added to the mock server's own list of requests
			return (this._oMockServer.attachAfter) ? [ // adapts to mock server new interface from UI5 1.30
				this._mockActivateProduct(),
				this._mockEditProduct(),
				this._mockCopyProduct()
			] : [
				this._mockActivateProduct(),
				this._mockAddProduct(),
				this._mockEditProduct(),
				this._mockCopyProduct()
			];
		},

		_mockAddProduct: function() {
			return {
				// This mock request is called when a new draft is created. Drafts created by clicking 'Add'
				// do not contain all necessary data. The missing data is added by this function
				method: "POST",
				path: new RegExp("ProductDrafts"),
				response: function(oXhr) {
					//Get the just created draft from the Xhr response
					var oDraft = this._textToJsonObject(oXhr.responseText).d;
					// the pattern matches when a draft is created with "Add" and with "Edit"
					if (!oDraft.ProductId) {
						//Adds default values to the new draft created with "Add"
						this._updateProductDraft(oDraft.Id, this._oNewDraftDefaultValues);
					}
				}.bind(this)
			};
		},

		onAfterDraftCreated: function(oEvt) {
			if (!oEvt.getParameters().oEntity.ProductId) {
				//Adds default values to the new draft object
				jQuery.extend(oEvt.getParameters().oEntity, this._oNewDraftDefaultValues);
			}
		},

		_mockEditProduct: function() {
			return {
				// This mock request simulates the function import "EditProduct", which is triggered when the user chooses the
				// "Edit" button.
				method: "POST",
				path: new RegExp("EditProduct\\?ProductId='(.*)'"),
				response: function(oXhr, sProductId) {
					/* eslint-disable */
					alert("Limitation: The upload control is not supported in demo mode with mock data.");
					/* eslint-enable */
					this._createDraft(oXhr, decodeURIComponent(sProductId), false);
				}.bind(this)
			};
		},

		_mockCopyProduct: function() {
			return {
				// This mock request simulates the function import "CopyProduct", which is triggered when the user chooses the
				// "Copy" button.
				method: "POST",
				path: new RegExp("CopyProduct\\?ProductId='(.*)'"),
				response: function(oXhr, sProductId) {
					/* eslint-disable */
					alert("Limitation: The upload control is not supported in demo mode with mock data.");
					/* eslint-enable */
					this._createDraft(oXhr, decodeURIComponent(sProductId), true);
				}.bind(this)
			};
		},

		_mockActivateProduct: function() {
			return {
				// This mock request simulates the function import "ActivateProduct", which is triggered when the user chooses
				// the "Save" button.
				// Here the draft's data is used to update an existing product (if the draft was created by editing a product)
				// or the draft is used to created a new product (if the draft was created by copying a product)
				method: "POST",
				path: new RegExp("ActivateProduct\\?ProductDraftId='(.*)'"),
				response: function(oXhr, sDraftIdInUrl) {
					var oProdDraft = this._getProductDraft(decodeURIComponent(sDraftIdInUrl)),
						bIsNewProduct = oProdDraft.IsNewProduct,
						oProduct = {};

					// create/update the product
					oProduct = this._buildProductFromDraft(oProdDraft);
					if (bIsNewProduct || typeof bIsNewProduct === "undefined") {
						this._createProduct(oProduct);
					} else {
						this._updateProduct(oProduct.Id, oProduct);
					}

					oXhr.respondJSON(200, {}, JSON.stringify({
						//Gets the changed/created product in order to get the correct metadata for the response data object.
						d: this._getProduct(oProduct.Id)
					}));
				}.bind(this)
			};
		},

		_buildProductFromDraft: function(oDraft) {
			// create a product object based on a draft
			var oProduct = oDraft,
				bIsNewProduct = false;

			//store the information if it is a new product for later
			bIsNewProduct = oDraft.IsNewProduct;
			// bIsNewProduct is 'undefined' if the draft was created with the "+" button of the master list
			if (typeof bIsNewProduct === "undefined") {
				bIsNewProduct = true;
			}
			delete oProduct.__metadata;
			//remove the draft specific fields from the product
			delete oProduct.SubCategoryName;
			delete oProduct.MainCategoryName;
			delete oProduct.Images;
			delete oProduct.IsNewProduct;
			delete oProduct.ExpiresAt;
			delete oProduct.ProductId;
			delete oProduct.IsDirty;

			//delete draft - it is not needed anymore when the product is created/updated
			this._deleteProductDraft(oDraft.Id);

			// if a new product is created using the "Add" button on the S2 screen then the category names are not yeet known
			if (!oProduct.SubCategoryName) {
				oProduct.SubCategoryName = this._getSubCategory(oProduct.SubCategoryId).Name;
			}
			if (!oProduct.MainCategoryName) {
				oProduct.MainCategoryName = this._getMainCategory(oProduct.MainCategoryId).Name;
			}

			// Converts WeightUnit/DimensionUnit between product and product draft
			oProduct.WeightUnit = this._getWeightText(oDraft.WeightUnit);
			oProduct.DimensionUnit = this._getDimensionText(oDraft.DimensionUnit);

			if (bIsNewProduct) {
				oProduct.RatingCount = 0;
				oProduct.AverageRating = 0;
				oProduct.StockQuantity = 0;
				if (!oProduct.ImageUrl) {
					oProduct.ImageUrl = "";
				}
			}
			return oProduct;
		},

		_getNewId: function() {
			this._iLastId++;
			return this._iLastId;
		},

		_createDraft: function(oXhr, sProductId, bNewProduct) {
			var oProduct = this._getProduct(sProductId),
				oDraft = {};

			// Writes the product data to the draft
			// Most of the values for the draft can be copied from the product
			jQuery.extend(oDraft, oProduct);
			// Delete the product's properties that are not contained in the draft
			delete oDraft.HasReviewOfCurrentUser;
			delete oDraft.RatingCount;
			delete oDraft.IsFavoriteOfCurrentUser;
			delete oDraft.StockQuantity;
			delete oDraft.AverageRating;
			delete oDraft.__metadata;

			// oDraft.CreatedAt = new Date();
			oDraft.CreatedBy = "Test User";
			// oDraft.ExpiresAt = new Date(oDraft.CreatedAt.getTime() + 1800000);
			oDraft.IsNewProduct = bNewProduct;
			oDraft.IsDirty = false;
			if (bNewProduct) {
				// A new product is created as a copy of an existing one
				oDraft.Id = "EPM-" + this._getNewId();
				oDraft.ProductId = oDraft.Id;
			} else {
				// A product is edited
				oDraft.Id = sProductId;
				oDraft.ProductId = sProductId;
			}
			// Converts WeightUnit/DimensionUnit between product and product draft
			oDraft.WeightUnit = this._getWeightUnit(oProduct.WeightUnit);
			oDraft.DimensionUnit = this._getDimensionUnit(oProduct.DimensionUnit);

			//Creates draft
			this._createProductDraft(oDraft);

			oXhr.respondJSON(200, {}, JSON.stringify({
				//Reads the just created draft again in order to get the correct draft structure (including metadata) for the response.
				d: this._getProductDraft(oDraft.Id)
			}));
		},

		_textToJsonObject: function(sObject) {
			// the Xhr objects contains contains JSon objects enceoded as text (e.g. responseBodytext)
			//  this functions converts such texts to JSon objects
			var oXhrModel = new sap.ui.model.json.JSONModel();
			oXhrModel.setJSON(sObject);
			return oXhrModel.getData();
		},

		_createProduct: function(oProduct) {
			var aProducts = this._oMockServer.getEntitySetData("Products");
			oProduct = this._extendMetadata(oProduct, "Product", "Products");
			aProducts.push(oProduct);
			this._oMockServer.setEntitySetData("Products", aProducts);
		},

		_createProductDraft: function(oDraft) {
			var aProductDrafts = this._oMockServer.getEntitySetData("ProductDrafts");
			oDraft.Images = {
				__deferred: {
					uri: this._oMockServer.getRootUri() + "ProductDrafts('" + oDraft.Id + "')/Images"
				}
			};
			oDraft = this._extendMetadata(oDraft, "ProductDraft", "ProductDrafts");
			aProductDrafts.push(oDraft);
			this._oMockServer.setEntitySetData("ProductDrafts", aProductDrafts);
		},

		_extendMetadata: function(oEntity, sEntityTypeName, sEntitySetName) {
			oEntity.__metadata = {
				id: this._oMockServer.getRootUri() + sEntitySetName + "('" + oEntity.Id + "')",
				type: "EPM_REF_APPS_PROD_MAN_SRV." + sEntityTypeName,
				uri: this._oMockServer.getRootUri() + sEntitySetName + "('" + oEntity.Id + "')"
			};
			return oEntity;
		},

		_updateProduct: function(sId, oUpdatedProperties) {
			this._updateEntity("Products", sId, oUpdatedProperties);
		},

		_updateProductDraft: function(sDraftId, oUpdatedProperties) {
			this._updateEntity("ProductDrafts", sDraftId, oUpdatedProperties);
		},

		_updateEntity: function(sEntitySetName, sId, oUpdatedProperties) {
			var aEntities = this._oMockServer.getEntitySetData(sEntitySetName),
				updateEntity = function(oEntity) {
					if (oEntity.Id === sId) {
						jQuery.extend(oEntity, oUpdatedProperties);
					}
					return oEntity;
				},
				aUpdatedEntities = aEntities.map(updateEntity);
			this._oMockServer.setEntitySetData(sEntitySetName, aUpdatedEntities);
		},

		_deleteProductDraft: function(sDraftId) {
			var aProductDrafts = this._oMockServer.getEntitySetData("ProductDrafts"),
				filterProductDraft = function(oDraft) {
					return oDraft.Id !== sDraftId;
				};
			aProductDrafts = aProductDrafts.filter(filterProductDraft);
			this._oMockServer.setEntitySetData("ProductDrafts", aProductDrafts);
		},

		_getProduct: function(sProductId) {
			return this._getFirstFoundEntity("Products", sProductId);
		},

		_getProductDraft: function(sDraftId) {
			return this._getFirstFoundEntity("ProductDrafts", sDraftId);
		},

		_getMainCategory: function(sMainCategoryId) {
			return this._getFirstFoundEntity("MainCategories", sMainCategoryId);
		},

		_getSubCategory: function(sSubCategoryId) {
			return this._getFirstFoundEntity("SubCategories", sSubCategoryId);
		},

		_getDimensionText: function(sDimensionUnit) {
			return this._getFirstFoundEntity("DimensionUnits", sDimensionUnit, "Unit").Shorttext;
		},

		_getDimensionUnit: function(sDimensionText) {
			return this._getFirstFoundEntity("DimensionUnits", sDimensionText, "Shorttext").Unit;
		},

		_getWeightText: function(sWeightUnit) {
			return this._getFirstFoundEntity("WeightUnits", sWeightUnit, "Unit").Shorttext;
		},

		_getWeightUnit: function(sWeightText) {
			return this._getFirstFoundEntity("WeightUnits", sWeightText, "Shorttext").Unit;
		},

		_getFirstFoundEntity: function(sEntitySetName, sId, sKeyName) {
			var aEntities = this._oMockServer.getEntitySetData(sEntitySetName);
			var aFound = jQuery.grep(aEntities, function(oFound) {
				return oFound[sKeyName ? sKeyName : "Id"] === sId;
			});
			return aFound.length > 0 && aFound[0];
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/localService/mockserver.js":function(){sap.ui.define([
	"sap/ui/core/util/MockServer",
	"nw/epm/refapps/ext/prod/manage/localService/MockRequests"
], function(MockServer, MockRequests) {
	"use strict";

	return {
		/**
		 * Initializes the mock server. You can configure the delay with the URL parameter "serverDelay"
		 * The local mock data in this folder is returned instead of the real data for testing.
		 *
		 * @public
		 */
		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				oMockServer = new MockServer({
					rootUri: "/sap/opu/odata/sap/EPM_REF_APPS_PROD_MAN_SRV/"
				}),
				oRequests = new MockRequests(oMockServer),
				sPath = jQuery.sap.getModulePath("nw.epm.refapps.ext.prod.manage.localService"),
				aRequests;

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 0)
			});

			// load local mock data
			oMockServer.simulate(sPath + "/metadata.xml", {
				sMockdataBaseUrl: sPath + "/mockdata"
			});
			aRequests = oMockServer.getRequests();
			oMockServer.setRequests(aRequests.concat(oRequests.getRequests()));
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		}
	};
});
},
	"nw/epm/refapps/ext/prod/manage/model/Products.js":function(){// Helper class for centrally handling oData CRUD and function import services. The interface provides the business
// meanings for the application and can be reused in different places where the UI-specific actions after the call
// could still be different and will be handled in the corresponding controller of the view.
// Every (main) view of this app has an instance of this class as an attribute so that it can forward all explicit
// backend calls to it.
// Note that this class forwards all delete operations to helper class nw.epm.refapps.products.manage.model.RemoveService,
// which is instantiated on demand.
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"./RemoveService",
	"nw/epm/refapps/ext/prod/manage/controller/messages"
], function(Object, JSONModel, RemoveService, messages) {
	"use strict";

	return Object.extend("nw.epm.refapps.ext.prod.manage.model.Products", {
		// Attributes of this class: 
		// _oResourceBundle, _oODataModel, _oApplicationProperties, _oApplicationController, _oMainView
		// are the global objects used throughout this app
		// _fnDeleteListener: see methods deleteListener of nw.epm.refapps.ext.prod.manage.Application 
		// _oWhenNoDraft: Is a Promise that will be resolved as soon as there is no draft 
		// which is currently in the process of being deleted.
		// _fnSetBackBusyDraftState: a function that sets back the global state isBusyCreatingDraft to false
		constructor: function(oComponent, oMainView) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oODataModel = oComponent.getModel();
			this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			this._fnDeleteListener = this._oApplicationController.deleteListener.bind(this._oApplicationController);
			this._oMainView = oMainView;
			this._oWhenNoDraft = new Promise(function(fnResolve) {
				fnResolve(); // Since we are currently not in the process of deleting a draft, the Promise is resolved immediately
			});
			this._fnSetBackBusyDraftState = this._oApplicationProperties.setProperty.bind(this._oApplicationProperties, "/isBusyCreatingDraft",
				false);
		},

		// Note: This function must not be called before the metadata have been read successfully
		getPathForProductId: function(sProductId) {
			return this._oODataModel.createKey("/Products", {
				Id: sProductId
			});
		},

		// Note: This function must not be called before the metadata have been read successfully
		getPathForDraftId: function(sDraftId) {
			return this._oODataModel.createKey("/ProductDrafts", {
				Id: sDraftId
			});
		},

		// Delete methods are forwarded to RemoveService. The specification of these methods can be found there.

		deleteProducts: function(aPaths, fnAfterDeleted) {
			var oDeleteHelper = this._getDeleteHelper(true, true);
			oDeleteHelper.deleteProducts(aPaths, fnAfterDeleted);
		},

		deleteProduct: function(sPath, fnAfterDeleted, bWithoutConfirmationDialog) {
			var oDeleteHelper = this._getDeleteHelper(true, true);
			if (bWithoutConfirmationDialog) {
				oDeleteHelper.deleteEntityWithoutConfirmationDialog(sPath, fnAfterDeleted, true);
			} else {
				oDeleteHelper.deleteProduct(sPath, fnAfterDeleted);
			}
		},

		// Deletes a draft (possibly with confirmation dialog).
		// Note that this method reassigns _oWhenNoDraft, as a new deletion process is started.
		deleteProductDraft: function(sPath, fnAfterDeleted, fnDeleteCanceled) {
			var oDeleteHelper = this._getDeleteHelper(false, false);
			if (this._oApplicationProperties.getProperty("/isDirty")) {
				// User needs to confirm the deletion
				var fnDeleteConfirmed = function(oPromise) {
					this._setWhenNoDraft(oPromise);
					if (fnAfterDeleted) {
						fnAfterDeleted();
					}
				}.bind(this);
				oDeleteHelper.deleteProductDraft(sPath, fnDeleteConfirmed, fnDeleteCanceled);
			} else {
				this._setWhenNoDraft(oDeleteHelper.deleteEntityWithoutConfirmationDialog(sPath, null, false));
				if (fnAfterDeleted) {
					fnAfterDeleted();
				}
			}
		},

		//  assign the _oWhenNoDraft promise to oPromise and handle error handling.
		_setWhenNoDraft: function(oPromise) {
			this._oWhenNoDraft = oPromise;
			// If the deletion of the draft fails we consider ourselves to have been thrown back to the situation that
			// a lost draft may exist.
			oPromise.catch(this._oApplicationProperties.setProperty.bind(this._oApplicationProperties, "/lostDraftReadState", -1));
		},

		deleteImageDraft: function(sPath, fnAfterDeleted) {
			var oDeleteHelper = this._getDeleteHelper(false, true);
			oDeleteHelper.deleteEntityWithoutConfirmationDialog(sPath, fnAfterDeleted, false);
		},

		// Additional methods for working with products

		// Creates a product draft for a new product.
		createProductDraft: function(fnProductDraftCreated) {
			this._oApplicationProperties.setProperty("/isBusyCreatingDraft", true);
			var fnCreateDraft = function() {
				// At least one attribute must be filled in the object passed to the create call (requirement of the oData
				// service)
				var oNewProduct = {
					ProductId: ""
				};
				this._oODataModel.create("/ProductDrafts", oNewProduct, {
					success: fnProductDraftCreated,
					error: this._getErrorForProcessing("isBusyCreatingDraft")
				});
			}.bind(this);
			// The backend will not accept the creation of a new draft, when still being in the process of
			// deleting the previous one. Therefore, creating the new draft is postponed in this case.
			this._oWhenNoDraft.then(fnCreateDraft, this._fnSetBackBusyDraftState);
		},

		// This method checks whether the user currently possesses a draft.
		// fnHandleDraftId is called when this information has been retrieved.
		// When a draft was found the id of the draft and the whole draft object are
		// transferred as parameters to fnHandleDraft. Otherwise fnHandleDraft is called
		// with faulty parameters.
		readProductDraft: function(fnHandleDraft, fnError) {
			var fnSuccess = function(oResponseContent) {
				var oProductDraft = oResponseContent.results[0];
				var sDraftId = oProductDraft && oProductDraft.Id;
				fnHandleDraft(sDraftId, oProductDraft);
			};
			this._oODataModel.read("/ProductDrafts", {
				success: fnSuccess,
				error: fnError
			});
		},

		// delete a draft without user interaction
		deleteDraft: function(sDraftId, fnAfterDeleted) {
			this._oApplicationProperties.setProperty("/isDirty", false);
			var sProductDraftPath = this._oODataModel.createKey("ProductDrafts", {
				Id: sDraftId
			});
			this.deleteProductDraft(sProductDraftPath, fnAfterDeleted, null);
		},

		// Creates product draft from a specified product ID for CopyProduct
		copyProductToDraft: function(sProductId, fnNavToDraft) {
			this._callFunctionAndNavToProductDraft("/CopyProduct", sProductId, fnNavToDraft);
		},

		// Gets product draft from a specified product ID for EditProduct
		getProductDraftFromProductId: function(sProductId, fnNavToDraft) {
			this._callFunctionAndNavToProductDraft("/EditProduct", sProductId, fnNavToDraft);
		},

		_callFunctionAndNavToProductDraft: function(sFunctionName, sProductId, fnNavToDraft) {
			// Calls function import EditProduct or CopyProduct
			this._oApplicationProperties.setProperty("/isBusyCreatingDraft", true);
			// The next draft must not be created before the deletion of the previous draft has been executed
			var fnCreateDraft = function() {
				this._callFunctionImport(sFunctionName, {
					ProductId: sProductId
				}, function(oResponseContent) {
					if (oResponseContent && oResponseContent.Id) {
						fnNavToDraft(oResponseContent.Id);
					}
				}, "isBusyCreatingDraft");
			}.bind(this);
			this._oWhenNoDraft.then(fnCreateDraft, this._fnSetBackBusyDraftState);
		},

		// Convenience method for calling function imports. Provides error handling.
		_callFunctionImport: function(sFunctionName, oURLParameters, fnAfterFunctionExecuted, sProcessingProperty) {
			this._oODataModel.callFunction(sFunctionName, {
				method: "POST",
				urlParameters: oURLParameters,
				success: fnAfterFunctionExecuted,
				error: this._getErrorForProcessing(sProcessingProperty)
			});
		},

		// Turns ProductDraft into Product and deletes ProductDraft
		activateProduct: function(fnDraftSaved, fnAfterActivation) {
			this._oApplicationProperties.setProperty("/isBusySaving", true);
			var fnResetBusy = function() {
				this._oApplicationProperties.setProperty("/isBusySaving", false);
			}.bind(this);
			this.oDraftToActivate = {
				sDraftId: this._oApplicationProperties.getProperty("/productId"),
				fnAfterActivation: fnAfterActivation
			};
			this._submitChanges(fnResetBusy, fnDraftSaved);
		},

		// Saves ProductDraft each time a user edits a field
		saveProductDraft: function(fnAfterSaved) {
			this._submitChanges(null, fnAfterSaved);
		},

		_submitChanges: function(fnSaveFailed, fnAfterSaved) {
			if (this._bIsChanging) {
				return;
			}
			if (this._oODataModel.hasPendingChanges()) {
				this._sMessage = null;
				var fnSuccess = function(oResponseData) {
					this._bIsChanging = false;
					if (!this._oODataModel.hasPendingChanges() || !this._sMessage) {
						var i;
						for (i = 0; i < oResponseData.__batchResponses.length && !this._sMessage; i++) {
							var oEntry = oResponseData.__batchResponses[i];
							if (oEntry.response) {
								this._sMessage = messages.extractErrorMessageFromDetails(oEntry.response.body);
							}
						}
					}
					if (this._sMessage) {
						fnAfterSaved(this._sMessage);
					} else {
						this._submitChanges(fnSaveFailed, fnAfterSaved);
					}
				}.bind(this);
				this._bIsChanging = true;
				var oParameters = {
					success: fnSuccess,
					error: fnSaveFailed,
					batchGroupId: "editproduct"
				};
				this._oODataModel.submitChanges(oParameters);
			} else if (this.oDraftToActivate) {
				if (this._sMessage) {
					this._oApplicationProperties.setProperty("/isBusySaving", false);
				} else {
					this._callFunctionImport("/ActivateProduct", {
						ProductDraftId: this.oDraftToActivate.sDraftId
					}, this.oDraftToActivate.fnAfterActivation, "isBusySaving");

				}
				this.oDraftToActivate = null;
			}
		},

		saveSelectProductDraft: function() {
			this._oODataModel.submitChanges(null, this.onSubmitDraftErrorSelect);
		},

		onSubmitDraftErrorSelect: function(oError) {
			// Currently no valueStateText for Select Control, but will be delivered by UI5 in v 26
			messages.showErrorMessage(oError, this._oMainView);
		},

		// This method is called when a modifying process has run onto an error.
		// sProcessingProperty is the global property which is currently true making the app busy
		// and which therefore must now be reset to false.
		_getErrorForProcessing: function(sProcessingProperty) {
			return function(oError) {
				this._oApplicationProperties.setProperty("/" + sProcessingProperty, false);
				messages.showErrorMessage(oError, this._oMainView);
			}.bind(this);
		},

		// Convenience method for retrieving an instance of the RemoveService
		_getDeleteHelper: function(bCallDeleteListener, bWithBusyDialog) {
			return new RemoveService(this._oODataModel, this._oResourceBundle, this._oApplicationProperties,
				this._getErrorForProcessing("isBusyDeleting"), bCallDeleteListener && this._fnDeleteListener, bWithBusyDialog);
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/model/RemoveService.js":function(){// Helper class for nw.epm.refapps.products.manage.model.Products. It provides generic handling when the UI5 OData
// DELETE service is called. The public functions in this class should give business semantics for the application (such
// as DELETE product(s), DELETE product draft, DELETE product image, with or without user confirmation). Currently the
// Products class uses this class by creating a transient instance on demand in order to execute exactly one (public)
// method of this class. However, this class is agnostic about this pattern. Note that instances of this class are
// created on demand (that is, immediately before the required public method of this class is executed) and garbage
// collected.
//
// Note that the entities to be deleted are always specified by paths (strings) in the OData model. For convenience,
// this class is tolerant on whether the path starts with "/" or not. See function fnGetPathWithSlash.
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"nw/epm/refapps/ext/prod/manage/controller/utilities"
], function(Object, MessageBox, MessageToast, utilities) {
	"use strict";

	// Normalization of OData-paths (puts a "/" in front of the path if it is not already there)
	function fnGetPathWithSlash(sPath) {
		return (sPath.indexOf("/") === 0 ? "" : "/") + sPath;
	}

	return Object.extend("nw.epm.refapps.ext.prod.manage.model.RemoveService", {
		// The following arguments are required for all public methods of this class, therefore they are modeled as instance
		// variables that must be provided in the constructor.
		// _oODataModel: Data model in which the Delete service is to be executed
		// _oResourceBundle: Application resource bundle (i18n) for showing texts used in the confirmation dialog
		// _fnShowErrorMessage: Generic error handling if the OData Delete call is unsuccessful
		/* eslint-disable */ // using more then 4 parameters for a function is justified here
		constructor: function(oODataModel, oResourceBundle, oApplicationProperties, fnShowErrorMessage, fnDeleteListener, bBusy) {
			/* eslint-enable */
			this._oODataModel = oODataModel;
			this._oResourceBundle = oResourceBundle;
			this._oApplicationProperties = oApplicationProperties;
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			this._fnShowErrorMessage = fnShowErrorMessage;
			this._fnDeleteListener = fnDeleteListener;
			this._bBusy = bBusy;
		},

		// Deletes multiple products - First, the user is asked to confirm the deletion. If he/she does, the products are
		// deleted. Otherwise, nothing happens.
		// aProductPaths - Array of strings representing the context paths to each product to be deleted. Note that the data
		// for these products must already be loaded into the oData model (this._oODataModel).
		// fnAfterDeleted - Function that is to be called if the deletion is successful. Note that there
		// is no callback for the case that no deletion takes place (be it because the user cancelled the deletion, be it
		// because an error occurred, be it because aProductPaths is empty). fnAfterDeleted can contain a single Boolean
		// parameter. This parameter is set to true if all specified products have been deleted successfully. The parameter
		// is set to false if the mass deletion operation returned the information that at least one delete operation
		// was unsuccessful.
		deleteProducts: function(aProductPaths, fnAfterDeleted) {
			if (aProductPaths.length === 0) {
				return;
			}
			var sQuestion, sSuccessMessage; // The question that is presented to the user in the confirmation dialog
			if (aProductPaths.length === 1) {
				var sProductName = this._oODataModel.getProperty(fnGetPathWithSlash(aProductPaths[0]) + "/Name");
				sQuestion = this._oResourceBundle.getText("ymsg.deleteText", sProductName);
				sSuccessMessage = this._oResourceBundle.getText("ymsg.deleteSuccess", sProductName);
			} else {
				sQuestion = this._oResourceBundle.getText("ymsg.deleteProducts", aProductPaths.length);
				sSuccessMessage = this._oResourceBundle.getText("ymsg.deleteMultipleSuccess", aProductPaths.length);
			}
			var fnMyAfterDeleted = function(bTotalSuccess) {
				if (bTotalSuccess) {
					MessageToast.show(sSuccessMessage);
				}
				if (fnAfterDeleted) {
					fnAfterDeleted(bTotalSuccess);
				}
			};
			this._confirmDeletionByUser({
				bDraft: false,
				question: sQuestion
			}, aProductPaths, fnMyAfterDeleted);
		},

		// Convenience method for deleting exactly one product. For more information, see method deleteProducts. Note that
		// fnAfterDeleted is always called with the parameter value true (if it is called at all).
		deleteProduct: function(sPath) {
			this.deleteProducts([sPath]);
		},

		// Deletes one product draft (with confirmation dialog). Parameter sPath is the same as in method deleteEntityWithoutConfirmationDialog.
		// Parameters fnDeleteConfirmed and fnDeleteCanceled are like in method _confirmDeletionByUser.
		deleteProductDraft: function(sPath, fnDeleteConfirmed, fnDeleteCanceled) {
			var sQuestion = this._oResourceBundle.getText("ymsg.warningConfirm");
			// Confirmation dialog needs to have the title "Warning" instead of Delete
			var sTitle = this._oResourceBundle.getText("xtit.warning");
			// Product draft is deleted once the user confirms the deletion
			var fnConfirmed = function(oPromise) {
				if (fnDeleteConfirmed) {
					fnDeleteConfirmed(oPromise);
				}
			};
			this._confirmDeletionByUser({
				bDraft: true,
				title: sTitle,
				question: sQuestion,
				icon: MessageBox.Icon.WARNING
			}, [sPath], null, fnDeleteCanceled, fnConfirmed);
		},

		// Deletes an entity (such as a product, product draft, or image draft) without sending a confirmation dialog.
		// The parameters are identical to method deleteProducts.
		// Returns a Promise which is fulfilled, as soon as the operation was ended successfully.
		deleteEntityWithoutConfirmationDialog: function(sPath, fnAfterDeleted) {
			return this._callDeleteService([sPath], fnAfterDeleted);
		},

		// Opens a dialog letting the user either confirm or cancel the deletion of a list of entities. If the user
		// confirms, all the entities are deleted.
		// oConfirmation - Configuration of the confirmation dialog. Possesses up to two attributes:
		// (i) question (obligatory) is a string providing the statement presented to the user
		// (ii) title (optional) may be a string defining the title of the popup.
		// The default title is 'Delete'.
		// aPaths - Array of strings representing the context paths to the entities to be deleted. Note that it is currently
		// assumed that the specified entities are all products if there is more than one entity.
		// fnAfterDeleted (optional) - works as in method deleteProducts
		// fnDeleteCanceled (optional) - called when the user decides not to perform the deletion
		// fnDeleteConfirmed (optional) - called when the user decides to perform the deletion. A Promise will be passed
		// to this function which will be resolved as soon as the deletion was performed in the backend.
		/* eslint-disable */ // using more then 4 parameters for a function is justified here
		_confirmDeletionByUser: function(oConfirmation, aPaths, fnAfterDeleted, fnDeleteCanceled, fnDeleteConfirmed) {
			/* eslint-enable */
			// Callback function for when the user decides to perform the deletion
			var fnDelete = function() {
				// Calls the oData Delete service
				var oPromise = this._callDeleteService(aPaths, fnAfterDeleted);
				if (fnDeleteConfirmed) {
					fnDeleteConfirmed(oPromise);
				}
			}.bind(this);

			// Opens the confirmation dialog
			var sLeavePage = this._oResourceBundle.getText("xbut.leavePage");
			var sAction = (oConfirmation.bDraft) ? sLeavePage : MessageBox.Action.OK;
			MessageBox.show(oConfirmation.question, {
				icon: oConfirmation.icon || MessageBox.Icon.WARNING,
				title: oConfirmation.title || this._oResourceBundle.getText("xtit.delete"),
				actions: [sAction, MessageBox.Action.CANCEL],
				onClose: function(oAction) {
					if (oAction === sAction) {
						fnDelete();
					} else if (fnDeleteCanceled) {
						fnDeleteCanceled();
					}
				},
				styleClass: utilities.getContentDensityClass()
			});
		},

		// Performs the deletion of a list of entities. For more information about the parameters, see method
		// _confirmDeletionByUser.
		// Returns a Promise that will be resolved as soon as the deletion process ended successfully.
		_callDeleteService: function(aPaths, fnAfterDeleted) {
			if (this._bBusy) {
				this._oApplicationProperties.setProperty("/isBusyDeleting", true);
			}
			if (this._fnDeleteListener) {
				this._fnDeleteListener(true, aPaths);
			}
			// Creates an error handler and a success handler. Both of them release the busy dialog and forward to the
			// appropriate handlers.
			var fnFailed = function(oError) {
				jQuery.sap.log.error("EPM Refapp Products", "Failed to delete product while calling backend service");
				// Calls the error message handler
				this._fnShowErrorMessage(oError);
			}.bind(this);
			// Note that for the success handler, there are two slightly different cases (batch versus direct call of the
			// Delete service)
			var fnSuccess = function(bSuccessful) {
				if (this._bBusy) {
					this._oApplicationProperties.setProperty("/isBusyDeleting", false);
				}
				// Note that parameter bSuccessful can only be expected for batch processing. If the deletion is
				// performed directly, this success handler is only called when the success was complete (because only
				// one item was to be deleted)
				var bTotalSuccess = aPaths.length === 1 || bSuccessful;
				// Executes the callback function for successful deletion
				if (fnAfterDeleted) {
					// Note that parameter bSuccessful can only be expected for batch processing. If the deletion is
					// performed directly, this success handler is only called when the success was complete (because only
					// one item was to be deleted).
					fnAfterDeleted(bTotalSuccess);
				}
				if (this._fnDeleteListener) {
					this._fnDeleteListener(false, aPaths, bTotalSuccess);
				}
			}.bind(this);
			// Calls the remote Delete service if exactly one entity has been specified, otherwise try the
			// batch deletion
			return aPaths.length === 1 ? this._deleteOneEntity(aPaths[0], fnSuccess, fnFailed) : this._deleteProducts(aPaths, fnSuccess, fnFailed);
		},

		// Deletes one entity (such as a product, product draft, or image draft) specified by sPath. Then calls the
		// specified success or error handler.
		// Returns a Promise that is resolved when the operation was successful. 
		_deleteOneEntity: function(sPath, fnSuccess, fnFailed) {
			var oPromise = new Promise(function(fnResolve, fnReject) {
				this._oODataModel.remove(fnGetPathWithSlash(sPath), {
					success: fnResolve,
					error: fnReject,
					async: true
				});
			}.bind(this));
			oPromise.then(fnSuccess, fnFailed);
			return oPromise;
		},

		// Deletes products specified by a list of paths using batch processing. Calls the corresponding handlers depending
		// on success or error.
		// Returns a Promise that is resolved when the operation was successful.
		// Note that success handler fnAfterDeleted still contains parameter bSuccess to specify whether all specified
		// entities were able to be deleted successfully or not.
		_deleteProducts: function(aPaths, fnAfterDeleted, fnFailed) {
			var sDeferredBatchGroupId = "BatchDelete",
				iNotDeleted = 0,
				fnSingleRemoveFailed = function() {
					iNotDeleted++;
				},
				fnSuccess = function() {
					if (iNotDeleted) {
						// A message box appears to inform the user that not all items were deleted.
						this._showMessageForPartiallyFailedDeletes(iNotDeleted);
					}
					fnAfterDeleted(!iNotDeleted);
				}.bind(this),
				oPromise = new Promise(function(fnResolve, fnReject) {
					for (var i = 0; i < aPaths.length; i++) {
						this._oODataModel.remove(fnGetPathWithSlash(aPaths[i]), {
							error: fnSingleRemoveFailed,
							batchGroupId: sDeferredBatchGroupId,
							changeSetId: i.toString()
						});
					}
					this._oODataModel.submitChanges({
						batchGroupId: sDeferredBatchGroupId,
						success: fnResolve,
						error: fnReject
					});
				}.bind(this));
			oPromise.then(fnSuccess, fnFailed);
			return oPromise;
		},

		// Shows error message for the partially-unsuccessful removals
		_showMessageForPartiallyFailedDeletes: function(iFailedRemoves) {
			MessageBox.show(this._oResourceBundle.getText("ymsg.deleteNProductsFailed", iFailedRemoves), {
				icon: MessageBox.Icon.ERROR,
				title: this._oResourceBundle.getText("xtit.error"),
				styleClass: utilities.getContentDensityClass()
			});
		}
	});
});
},
	"nw/epm/refapps/ext/prod/manage/model/formatter.js":function(){sap.ui.define([
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat"
], function(NumberFormat, DateFormat) {
	"use strict";

	function fnGetServiceUrl(oController) {
		var oApplicationProperties = oController.getView().getModel("appProperties");
		return oApplicationProperties.getProperty("/serviceUrl");
	}

	var oAmountFormatter = NumberFormat.getCurrencyInstance();

	return {
		formatAvailabilityText: function(iAvailability) {
			if (iAvailability === null) {
				return "";
			}
			var sKey = iAvailability < 1 ? "xfld.outstock" : (iAvailability < 10 ? "xfld.restricted10" : "xfld.instock"),
				oBundle = this.getView().getModel("i18n").getResourceBundle();
			return oBundle.getText(sKey);
		},

		/**
		 * Formatter for Measures - Returns concatenated string with Measure and Unit
		 *
		 * @param {float}
		 *            fMeasure A measure
		 * @param {string}
		 *            sUnit A unit
		 * @returns {string} A combined textual representation of measure and unit
		 * @public
		 */
		formatMeasure: function(fMeasure, sUnit) {
			if (fMeasure === null) {
				return "";
			}
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			return oBundle.getText("xfld.formatMeasure", [fMeasure, sUnit]);
		},

		// Forms the image URL for the image GUID specified.
		// sDraftId -- Product draft ID that the new image is uploaded to.
		// Returns the relative path of the image URL.
		formatImageURL: function(sId) {
			var sPath = "";
			if (sId && typeof sId === "string") {
				sPath = fnGetServiceUrl(this) + this.getView().getModel().createKey("/ImageDrafts", {
					Id: sId
				}) + "/$value";
			}
			return sPath;
		},

		// Gets the image upload URL for the product draft specified.
		// sDraftId -- Product draft ID that the new image is uploaded to.
		// Returns the relative path of the image upload path for the product draft specified.
		getImageUploadURL: function(sDraftId) {
			var sUploadPath = "";
			if (sDraftId && typeof sDraftId === "string") {
				// sUploadPath = fnGetServiceUrl(this) + "/ProductDrafts('" + sDraftId + "')/Images";
				sUploadPath = fnGetServiceUrl(this) + this.getView().getModel().createKey("/ProductDrafts", {
					Id: sDraftId
				}) + "/Images";
			}
			return sUploadPath;
		},

		formatEditTitle: function(bIsNewObject) {
			if (bIsNewObject !== !!bIsNewObject) { // check whether bIsNewObject is boolean
				return ""; // do not set a title when no data are available
			}
			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			return oBundle.getText(bIsNewObject ? "xtit.productNew" : "xtit.productEdit");
		},

		lostDraftQuestion: function(oProductDraft) {
			var oDateFormatter = DateFormat.getDateTimeInstance({
					style: "short"
				}),
				sDate = oDateFormatter.format(oProductDraft.CreatedAt),
				oBundle = this.oResourceBundle;
			// The message presented to the user depends on whether the draft is for a new product or an already existing
			// product
			return oProductDraft.IsNewProduct ? oBundle.getText("ymsg.editNewDraft", [sDate]) :
				oBundle.getText("ymsg.editDraft", [oProductDraft.Name, sDate]);
		},

		appDataForTile: function(sName) {
			return {
				title: sName
			};
		},

		// Formatter for amount
		formatAmount: function(fAmount) {
			if (!fAmount) {
				return "";
			}
			return oAmountFormatter.format(fAmount);
		}
	};
});
},
	"nw/epm/refapps/ext/prod/manage/model/models.js":function(){sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/model/resource/ResourceModel"
], function(JSONModel, Device, ODataModel, ResourceModel) {
	"use strict";

	function extendMetadataUrlParameters(aUrlParametersToAdd, oMetadataUrlParams, sServiceUrl) {
		var oExtensionObject = {},
			oServiceUri = new URI(sServiceUrl);

		aUrlParametersToAdd.forEach(function(sUrlParam) {
			var oUrlParameters,
				sParameterValue;

			if (sUrlParam === "sap-language") {
				var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser");
				if (fnGetuser) {
					// for sap-language we check if the launchpad can provide it.
					oMetadataUrlParams["sap-language"] = fnGetuser().getLanguage();
				}
			} else {
				oUrlParameters = jQuery.sap.getUriParameters();
				sParameterValue = oUrlParameters.get(sUrlParam);
				if (sParameterValue) {
					oMetadataUrlParams[sUrlParam] = sParameterValue;
					oServiceUri.addSearch(sUrlParam, sParameterValue);
				}
			}
		});

		jQuery.extend(oMetadataUrlParams, oExtensionObject);
		return oServiceUri.toString();
	}

	return {
		/**
		 *
		 * @param oOptions {object} a map which contains the following parameter properties
		 * @param oOptions.url {string} see {@link sap.ui.model.odata.v2.ODataModel#constructor.sServiceUrl}.
		 * @param [oOptions.urlParametersForEveryRequest] {object} If the parameter is present in the URL or in case of language the UShell can provide it,
		 * it is added to the odata models metadataUrlParams {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters.metadataUrlParams}, and to the service url.
		 * If you provided a value in the config.metadataUrlParams this value will be overwritten by the value in the url.
		 *
		 * Example: the app is started with the url query, and the user has an us language set in the launchpad:
		 *
		 * ?sap-server=serverValue&sap-host=hostValue
		 *
		 * The createODataModel looks like this.
		 *
		 * models.createODataModel({
		 *     urlParametersToPassOn: [
		 *         "sap-server",
		 *         "sap-language",
		 *         "anotherValue"
		 *     ],
		 *     url : "my/Url"
		 * });
		 *
		 * then the config will have the following metadataUrlParams:
		 *
		 * metadataUrlParams: {
		 *     // retrieved from the url
		 *     "sap-server" : "serverValue"
		 *     // language is added from the launchpad
		 *     "sap-language" : "us"
		 *     // anotherValue is not present in the url and will not be added
		 * }
		 *
		 * @param [oOptions.config] {object} see {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters} it is the exact same object, the metadataUrlParams are enrichted by the oOptions.urlParametersToPassOn
		 * @returns {sap.ui.model.odata.v2.ODataModel}
		 */
		createODataModel: function(oOptions) {
			var aUrlParametersForEveryRequest,
				oConfig,
				sUrl;

			oOptions = oOptions || {};

			if (!oOptions.url) {
				jQuery.sap.log.error("Please provide a url when you want to create an ODataModel",
					"nw/epm/refapps/ext/prod/manage.model.models.createODataModel");
				return null;
			}

			// create a copied instance since we modify the config
			oConfig = jQuery.extend(true, {}, oOptions.config);

			aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest || [];
			oConfig.metadataUrlParams = oConfig.metadataUrlParams || {};

			sUrl = extendMetadataUrlParameters(aUrlParametersForEveryRequest, oConfig.metadataUrlParams, oOptions.url);

			return this._createODataModel(sUrl, oConfig);
		},

		_createODataModel: function(sUrl, oConfig) {
			return new ODataModel(sUrl, oConfig);
		},

		createDeviceModel: function() {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createResourceModel: function(sRootPath, resourceBundle) {
			this._resourceModel = new ResourceModel({
				bundleUrl: [sRootPath, resourceBundle].join("/")
			});
			return this._resourceModel;
		}
	};
});
},
	"nw/epm/refapps/ext/prod/manage/view/App.view.xml":'<mvc:View xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc" controllerName="nw.epm.refapps.ext.prod.manage.controller.App" displayBlock="true" height="100%"\n\tbusy="{appProperties>/isAppBusy}" busyIndicatorDelay="0">\n\t<SplitApp id="fioriContent" />\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/EmptyPage.view.xml":'<mvc:View xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" height="100%" controllerName="nw.epm.refapps.ext.prod.manage.controller.EmptyPage">\r\n    <MessagePage id="messagePage" showNavButton="{device>/system/phone}" navButtonPress="onNavButtonPress" text="{appProperties>/emptyText}" description=""/>\r\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/LostDraftDialog.fragment.xml":'<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">\r\n    <Dialog id="lostDraftDialog" \r\n        title="{i18n>xtit.unsavedDraft}" contentWidth="400px" verticalScrolling="false" contentHeight="auto" class="sapUiContentPadding" >\r\n        <content>\r\n            <Text id="questionText" text="{path:\'draft>/productDraft\', formatter: \'.formatter.lostDraftQuestion\'}" />\r\n        </content>\r\n        <buttons>\r\n            <Button id="resumeButton" text="{i18n>xbut.resume}" press="onResume" />\r\n            <Button id="discardButton" text="{i18n>xbut.discard}" press="onDiscard" />\r\n        </buttons>\r\n    </Dialog>\r\n</core:FragmentDefinition>',
	"nw/epm/refapps/ext/prod/manage/view/ProductDisplay.view.xml":'<mvc:View\r\n\txmlns="sap.m" xmlns:core="sap.ui.core" xmlns:l="sap.ui.layout" xmlns:f="sap.ui.layout.form" xmlns:mvc="sap.ui.core.mvc"\r\n\txmlns:prod="nw.epm.refapps.ext.prod.manage.control"\r\n\tcontrollerName="nw.epm.refapps.ext.prod.manage.controller.ProductDisplay"\r\n\tbusy ="{= !(${viewProperties>/dataLoaded} || ${appProperties>/isAppBusy} || ${appProperties>/metaDataLoadState} === -1) }"\r\n\tbusyIndicatorDelay="{appProperties>/detailBusyIndicatorDelay}">\r\n\t<Page id="page" title="{i18n>xtit.product}" showNavButton="{device>/system/phone}" navButtonPress="onNavButtonPress">\r\n\t\t<content>\r\n\t\t\t<!-- Object Header -->\r\n\t\t\t<ObjectHeader\r\n\t\t\t\tid="ProductHeader" title="{Name}" icon="{ImageUrl}" iconDensityAware="false" numberUnit="{CurrencyCode}"\r\n\t\t\t\tnumber="{path:\'Price\', formatter: \'.formatter.formatAmount\'}" responsive="true" >\r\n\t\t\t\t<statuses>\r\n\t\t\t\t\t<ObjectStatus id="availabilityStatus"\r\n\t\t\t\t\t\ttext="{path: \'StockQuantity\', formatter: \'.formatter.formatAvailabilityText\'}"\r\n\t\t\t\t\t\tstate="{= ${StockQuantity} &lt; 1 ? \'Error\' : \'Success\' }" />\r\n\t\t\t\t</statuses>\r\n\t\t\t\t<attributes>\r\n\t\t\t\t\t<ObjectAttribute id="categoryAttribute"\r\n\t\t\t\t\t\ttitle="{/#Product/MainCategoryName/@sap:label}"\r\n\t\t\t\t\t\ttext="{MainCategoryName}" />\r\n\t\t\t\t\t<ObjectAttribute id="subcategoryAttribute"\r\n\t\t\t\t\t\ttitle="{/#Product/SubCategoryName/@sap:label}"\r\n\t\t\t\t\t\ttext="{SubCategoryName}"/>\r\n\t\t\t\t</attributes>\r\n\t\t\t</ObjectHeader>\r\n\t\t\t\r\n\t\t\t<!--Allow adding fields after the object header -->\r\n\t\t\t<core:ExtensionPoint name="extensionAfterObjectHeader" />\r\n\t\t\t\r\n\t\t\t<!-- General Information -->\r\n\t\t\t<f:SimpleForm id="generalInformationForm" class="sapUiForceWidthAuto sapUiResponsiveMargin"\r\n\t\t\t\tminWidth="1024" maxContainerCols="2" editable="false" layout="ResponsiveGridLayout" labelSpanL="4" labelSpanM="4"\r\n\t\t\t\temptySpanL="1" emptySpanM="1" columnsL="7" columnsM="7" title="{i18n>xtit.generalInfo}">\r\n\t\t\t\t<f:content>\r\n\t\t\t\t\t<Label id="idLabel" text="{/#Product/Id/@sap:label}" />\r\n\t\t\t\t\t<Text id="idText" text="{Id}" />\r\n\t\t\t\t\t<Label id="descriptionLabel" text="{/#Product/Description/@sap:label}" />\r\n\t\t\t\t\t<Text id="descriptionText" text="{Description}" />\r\n\t\t\t\t\t<Label id="supplierLabel" text="{/#Product/SupplierName/@sap:label}" />\r\n\t\t\t\t\t<Link id="supplierLink" text="{SupplierName}" class="sapUiForceWidthAuto" press="onSupplierPressed" />\r\n\t\t\t\t\t<Label id="reviewsLabel" text="{i18n>xfld.reviews}" />\r\n\t\t\t\t\t<!-- Call Custom Control for Rating Count -->\r\n\t\t\t\t\t<prod:RatingAndCount id="ratingValue" maxRatingValue="5"\r\n\t\t\t\t\tvalue="{AverageRating}" enabled="false"\r\n\t\t\t\t\ticonSize="0.8rem" ratingCount="{RatingCount}" verticalAdjustment="-15" verticalAlignContent="true" />\r\n\t\t\t\t</f:content>\r\n\t\t\t</f:SimpleForm>\r\n\t\t\t<!-- Technical Information -->\r\n\t\t\t<f:SimpleForm id="techicalInformationForm" class="sapUiForceWidthAuto sapUiResponsiveMargin"\r\n\t\t\t\tminWidth="1024" maxContainerCols="2" editable="false" layout="ResponsiveGridLayout" labelSpanL="4" labelSpanM="4"\r\n\t\t\t\temptySpanL="1" emptySpanM="1" columnsL="7" columnsM="7" title="{i18n>xtit.techData}">\r\n\t\t\t\t<f:content>\r\n\t\t\t\t\t<Label id="unitLabel" text="{/#Product/QuantityUnit/@sap:label}" />\r\n\t\t\t\t\t<Text id="unitText" text="{MeasureUnit}"></Text>\r\n\t\t\t\t\t<Label id="heightLabel" text="{/#Product/DimensionHeight/@sap:label}" />\r\n\t\t\t\t\t<Text id="heightText" text="{parts:[{path: \'DimensionHeight\', type: \'sap.ui.model.type.Float\', formatOptions: {style: \'long\'}}, {path: \'DimensionUnit\'}], formatter: \'.formatter.formatMeasure\' }" />\r\n\t\t\t\t\t<Label id="widthLabel" text="{/#Product/DimensionWidth/@sap:label}" />\r\n\t\t\t\t\t<Text id="widthText" text="{parts:[{path: \'DimensionWidth\', type: \'sap.ui.model.type.Float\', formatOptions: {style: \'long\'}}, {path: \'DimensionUnit\'}], formatter: \'.formatter.formatMeasure\' }" />\r\n\t\t\t\t\t<Label id="depthLabel" text="{/#Product/DimensionDepth/@sap:label}" />\r\n\t\t\t\t\t<Text id="depthText" text="{parts:[{path: \'DimensionDepth\', type: \'sap.ui.model.type.Float\', formatOptions: {style: \'long\'}}, {path: \'DimensionUnit\'}], formatter: \'.formatter.formatMeasure\' }" />\r\n\t\t\t\t\t<Label id="weightLabel" text="{/#Product/WeightMeasure/@sap:label}" />\r\n\t\t\t\t\t<Text id="weightText" text="{parts:[{path: \'WeightMeasure\', type: \'sap.ui.model.type.Float\', formatOptions: {style: \'long\'}}, {path: \'WeightUnit\'}], formatter: \'.formatter.formatMeasure\' }" />\r\n\t\t\t\t</f:content>\r\n\t\t\t</f:SimpleForm>\r\n\t\t\t\t\t\r\n\t\t\t<!--Allow adding fields at the bottom of the display screen -->\r\n\t\t\t<core:ExtensionPoint name="extensionBottomOfScreen"/>\r\n\t\t</content>\r\n\t\t<footer>\r\n\t    \t<OverflowToolbar id="footerToolbar">\r\n\t\t\t\t<ToolbarSpacer id="footerBeginSpacer"/>\r\n\t\t\t\t<Button  id="editButton" text="{i18n>xbut.edit}" enabled ="{= !${appProperties>/isMultiSelect} &amp;&amp; ${appProperties>/lostDraftReadState} === 1 }" press="onEditPressed" type="Emphasized" />\r\n\t\t\t\t<Button  id="deleteButton" text="{i18n>xbut.delete}" enabled ="{= !${appProperties>/isMultiSelect} &amp;&amp; ${appProperties>/lostDraftReadState} === 1 }" press="onDeletePressed" />\r\n\t\t\t\t<Button  id="copyButton" text="{i18n>xbut.copy}" enabled ="{= !${appProperties>/isMultiSelect} &amp;&amp; ${appProperties>/lostDraftReadState} === 1 }" press="onCopyPressed" />\r\n\t\t\t\t<Button id="shareButton" icon="sap-icon://action"  press="onSharePressed" enabled="{viewProperties>/dataLoaded}" />\r\n\t\t\t</OverflowToolbar>\r\n\t\t</footer>\r\n\t</Page>\r\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/ProductDraftUploadImages.view.xml":'<mvc:View xmlns="sap.m" xmlns:mvc="sap.ui.core.mvc"\r\n\t\tcontrollerName="nw.epm.refapps.ext.prod.manage.controller.ProductDraftUploadImages">\r\n\r\n<!-- The list of file types is not complete and needs to be adjusted according to the specific requirements -->\r\n\t<UploadCollection id="Upload_Images" items="{Images}" multiple="false" class="sapUiForceWidthAuto sapUiResponsiveMargin"\r\n\t\tuploadUrl="{path:\'Id\', formatter: \'.formatter.getImageUploadURL\'}" sameFilenameAllowed="true"\r\n\t\tuploadComplete="onUploadCompleted" fileDeleted="onImageDelete" change="onChange" typeMissmatch="onFileTypeMismatch"\r\n\t\tnoDataText="{= ${viewProperties>/dataLoaded} ? ${i18n>ymsg.noAttachments} : \' \'}"\r\n\t\tfileType="{[ \'jpg\', \'jpeg\', \'Png\', \'bmp\', \'PNG\', \'JPEG\' ]}">\r\n\t\t<items>\r\n\t\t\t<UploadCollectionItem id="uploadCollectionItem" contributor="{CreatedBy}" \r\n\t\t\t\tuploadedDate="{path:\'CreatedAt\', type:\'sap.ui.model.type.DateTime\'}"\r\n\t\t\t\tfileName="" enableEdit="false" enableDelete="{IsDeletable}"\r\n\t\t\t\tthumbnailUrl = "{path: \'Id\', formatter: \'.formatter.formatImageURL\'}" \r\n\t\t\t\turl="{path: \'Id\', formatter: \'.formatter.formatImageURL\'}"\r\n\t\t\t\tdocumentId = "{Id}">\r\n\t\t\t</UploadCollectionItem>\r\n\t\t</items>\r\n\t</UploadCollection>\r\n\r\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/ProductEdit.view.xml":'<mvc:View\r\n\txmlns:core="sap.ui.core" xmlns="sap.m" xmlns:f="sap.ui.layout.form" xmlns:l="sap.ui.layout" xmlns:mvc="sap.ui.core.mvc"\r\n\tcontrollerName="nw.epm.refapps.ext.prod.manage.controller.ProductEdit">\r\n\t<Page id="page" showNavButton="{device>/system/phone}" title="{path: \'IsNewProduct\', formatter: \'.formatter.formatEditTitle\'}" navButtonPress="onNavButtonPress">\r\n\t\t<content>\r\n\t\t\t<!-- Form for Product Information -->\r\n\t\t\t<f:SimpleForm id="productInformationForm" class="sapUiForceWidthAuto sapUiResponsiveMargin"\r\n\t\t\t\tminWidth="1024" maxContainerCols="2" editable="true" layout="ResponsiveGridLayout"\r\n\t\t\t\tlabelSpanL="4" labelSpanM="4" emptySpanL="1" emptySpanM="1" columnsL="7" columnsM="7"\r\n\t\t\t\ttitle="{i18n>xtit.generalInfo}">\r\n\t\t\t\t<f:content>\r\n\t\t\t\t\t<Label id="nameLabel" text="{/#Product/Name/@sap:label}" required="true"/>\r\n\t\t\t\t\t<Input id="productNameInput"\r\n\t\t\t\t\t\ttype="Text" valueStateText="{i18n>ymsg.errorName}"\r\n\t\t\t\t\t\tmaxLength="{path: \'/#Product/Name/@maxLength\', formatter: \'Number\'}"\r\n\t\t\t\t\t\tchange="onInputChange"\r\n\t\t\t\t\t\tvalue="{path: \'Name\'}"/>\r\n\t\t\t\t\t<Label id="priceLabel" \r\n\t\t\t\t\t\t\ttext="{parts:[{path: \'i18n>xfld.textConcat\'}, {path: \'/#Product/Price/@sap:label\'}, {path: \'/#Product/CurrencyCode/@sap:label\'}], \r\n        \t\t\t\t\t\t\tformatter: \'jQuery.sap.formatMessage\'}" required="true"/>\r\n\t\t\t\t\t<Input id="priceInput" valueStateText="{i18n>ymsg.errorPrice}"\r\n\t\t\t\t\t\tchange="onNumberChange"\r\n\t\t\t\t\t\tvalue="{Price}" type="Text"\r\n\t\t\t\t\t\ttextAlign="Right" />\r\n\t\t\t\t\t<ComboBox id="currencyBox" valueStateText="{i18n>ymsg.errorCurrency}" selectedKey="{CurrencyCode}"\r\n\t\t\t\t\t\titems="{path: \'/Currencies\', length: \'300\'}"  selectionChange="onInputChange">\r\n\t\t\t\t\t\t<core:Item id="currencyItem" key="{Code}" text="{Code}" />\r\n\t\t\t\t\t</ComboBox>\r\n\t\t\t\t\t<Label id="categoryLabel" text="{/#Product/MainCategoryName/@sap:label}" required="true"></Label>\r\n\t\t\t\t\t<ComboBox id="categoryBox" \r\n\t\t\t\t\t    valueStateText="{i18n>ymsg.errorMainCategory}"\r\n\t\t\t\t\t\tselectionChange="onCategoryChange"\r\n\t\t\t\t\t\tselectedKey="{MainCategoryId}"\r\n\t\t\t\t\t\titems="{path: \'/MainCategories\'}">\r\n\t\t\t\t\t\t<core:Item id="categoryItem" key="{Id}" text="{Name}" />\r\n\t\t\t\t\t</ComboBox>\r\n\t\t\t\t\t<Label id="emptyLabel"/>\r\n\t\t\t\t\t<Label id="subcategoryLabel" text="{/#Product/SubCategoryName/@sap:label}" required="true"/>\r\n\t\t\t\t\t<ComboBox id="subcategoryBox"\r\n\t\t\t\t\t\tvalueStateText="{i18n>ymsg.errorSubCategory}"\r\n\t\t\t\t\t\tselectionChange="onSubcategoryChange"\r\n\t\t\t\t\t\tselectedKey="{SubCategoryId}"\r\n\t\t\t\t\t\titems="{path: \'/SubCategories\', sorter: {path: \'Name\', descending: false}}">\r\n\t\t\t\t\t\t<core:Item id="subcategoryItem" key="{Id}" text="{Name}" />\r\n\t\t\t\t\t</ComboBox>\r\n\t\t\t\t\t<Label id="productIdLabel" text="{/#Product/Id/@sap:label}"/>\r\n\t\t\t\t\t<Input id="productIdInput" editable="false" value="{Id}"/>\r\n\t\t\t\t\t<Label id="descriptionLabel" text="{/#Product/Description/@sap:label}" required="true"/>\r\n\t\t\t\t\t<TextArea id="descriptionArea" \r\n\t\t\t\t\t    valueStateText="{i18n>ymsg.errorDescription}"\r\n\t\t\t\t\t\tmaxLength="{path: \'/#Product/Description/@maxLength\', formatter: \'Number\'}"\r\n\t\t\t\t\t\tchange="onInputChange"\r\n\t\t\t\t\t\tvalue="{path: \'Description\'}"/>\r\n\t\t\t\t\t<Label id="supplierLabel" text="{/#Product/SupplierName/@sap:label}" required="true"/>\r\n\t\t\t\t\t<Input id="supplierInput" \r\n\t\t\t\t\t    type="Text" valueStateText="{i18n>ymsg.errorSupplier}"\r\n\t\t\t\t\t\tmaxLength="{path: \'/#Product/SupplierName/@maxLength\', formatter: \'Number\'}"\r\n\t\t\t\t\t\tchange="onInputChange"\r\n\t\t\t\t\t\tshowSuggestion="true" suggest="suggestMethod" maxSuggestionWidth="600px" filterSuggests="false"\r\n\t\t\t\t\t\tvalue="{path: \'SupplierName\'}"/>\r\n\t\t\t\t\t<Label id="placeHolderLabel"/>\r\n\t\t\t\t</f:content>\r\n\t\t\t</f:SimpleForm>\r\n\r\n\t\t\t<!-- Form for Physical Properties -->\r\n\t\t\t<f:SimpleForm id="physicalPropertiesForm" class="sapUiForceWidthAuto sapUiResponsiveMargin"\r\n\t\t\t\tminWidth="1024" maxContainerCols="2" editable="true" layout="ResponsiveGridLayout"\r\n\t\t\t\tlabelSpanL="4" labelSpanM="4" emptySpanL="1" emptySpanM="1" columnsL="7" columnsM="7" title="{i18n>xtit.techData}">\r\n\t\t\t\t<f:content>\r\n\t\t\t\t\t<Label id="unitOfMeasureLabel" text="{/#Product/QuantityUnit/@sap:label}" required="true"/>\r\n\t\t\t\t\t<ComboBox id="unitOfMeasureBox" \r\n\t\t\t\t\t    valueStateText="{i18n>ymsg.errorQuantityUnit}" selectedKey="{QuantityUnit}"\r\n\t\t\t\t\t\tchange="onInputChange"\r\n\t\t\t\t\t\titems="{path: \'/QuantityUnits\', sorter: {path: \'Shorttext\', descending: false}}">\r\n\t\t\t\t\t\t<core:Item id= "unitOfMeasureItem" key="{Unit}" text="{Shorttext}" />\r\n\t\t\t\t\t</ComboBox>\r\n\t\t\t\t\t<Label id="heightLabel" \r\n\t\t\t\t\t\ttext="{parts:[{path: \'i18n>xfld.textConcat\'}, {path: \'/#Product/DimensionHeight/@sap:label\'}, {path: \'i18n>xfld.uoM\'}], \r\n        \t\t\t\t\t\t\tformatter: \'jQuery.sap.formatMessage\'}"/>\r\n\t\t\t\t\t<Input id="heightInput" type="Text"\r\n\t\t\t\t\t\tchange="onNumberChange"\r\n\t\t\t\t\t\tvalue="{DimensionHeight}"\r\n\t\t\t\t\t\ttextAlign="Right"/>\r\n\t\t\t\t\t<Select id="heightUomSelect" \r\n\t\t\t\t\t    selectedKey="{DimensionUnit}" items="{path: \'/DimensionUnits\'}" change="onSelectChange">\r\n\t\t\t\t\t\t<core:Item id="heightUomItem" key="{Unit}" text="{Text}" />\r\n\t\t\t\t\t</Select>\r\n\t\t\t\t\t<Label id="widthLabel" \r\n\t\t\t\t\t\ttext="{parts:[{path: \'i18n>xfld.textConcat\'}, {path: \'/#Product/DimensionWidth/@sap:label\'}, {path: \'i18n>xfld.uoM\'}], \r\n        \t\t\t\t\t\t\tformatter: \'jQuery.sap.formatMessage\'}"/>\r\n\t\t\t\t\t<Input id="widthInput" type="Text"\r\n\t\t\t\t\t\tchange="onNumberChange"\r\n\t\t\t\t\t\tvalue="{DimensionWidth}"\r\n\t\t\t\t\t\ttextAlign="Right"/>\r\n\t\t\t\t\t<Select id="widthUomSelect" \r\n\t\t\t\t\t    selectedKey="{DimensionUnit}" items="{path: \'/DimensionUnits\'}" change="onSelectChange">\r\n\t\t\t\t\t\t<core:Item id="widthUomItem" key="{Unit}" text="{Text}" />\r\n\t\t\t\t\t</Select>\r\n\t\t\t\t\t<Label id="lengthLabel" \t\t\t\t\t\t\t\r\n\t\t\t\t\t\ttext="{parts:[{path: \'i18n>xfld.textConcat\'}, {path: \'/#Product/DimensionDepth/@sap:label\'}, {path: \'i18n>xfld.uoM\'}], \r\n        \t\t\t\t\t\t\tformatter: \'jQuery.sap.formatMessage\'}" />\r\n\t\t\t\t\t<Input id="lengthInput" type="Text"\r\n\t\t\t\t\t\tchange="onNumberChange"\r\n\t\t\t\t\t\tvalue="{DimensionDepth}" \r\n\t\t\t\t\t\ttextAlign="Right"/>\r\n\t\t\t\t\t<Select id="lengthUomSelect" \r\n\t\t\t\t\t    selectedKey="{DimensionUnit}" items="{path: \'/DimensionUnits\'}" change="onSelectChange">\r\n\t\t\t\t\t\t<core:Item id="lengthUomItem" key="{Unit}" text="{Text}" />\r\n\t\t\t\t\t</Select>\r\n\t\t\t\t\t<Label id="weightLabel" \r\n\t\t\t\t\t\ttext="{parts:[{path: \'i18n>xfld.textConcat\'}, {path: \'/#Product/WeightMeasure/@sap:label\'}, {path: \'i18n>xfld.uoM\'}], \r\n        \t\t\t\t\t\t\tformatter: \'jQuery.sap.formatMessage\'}" />\r\n\t\t\t\t\t<Input id="weightInput" type="Text"\r\n\t\t\t\t    \tchange="onNumberChange" \r\n\t\t\t\t    \tvalue="{WeightMeasure}"\r\n\t\t\t\t\t    textAlign="Right"/>\r\n\t\t\t\t\t<Select id="weightUomSelect"\r\n\t\t\t\t\t\tselectedKey="{WeightUnit}" items="{path: \'/WeightUnits\'}" change="onSelectChange">\r\n\t\t\t\t\t\t<core:Item id="weightUomItem" key="{Unit}" text="{Text}" />\r\n\t\t\t\t\t</Select>\r\n\t\t\t\t</f:content>\r\n\t\t\t</f:SimpleForm>\r\n\r\n\t\t\t<!-- Sub-View for Uploading/Removing Images -->\r\n\t\t\t<mvc:XMLView viewName="nw.epm.refapps.ext.prod.manage.view.ProductDraftUploadImages" id="View_ImageUpload" />\r\n\t\t\t\r\n\t\t\t<!--Allow adding fields at the bottom of the edit screen -->\r\n\t\t\t<core:ExtensionPoint name="extensionBottomOfEditScreen"/>\r\n\t\t</content>\r\n\t\t<footer>\r\n\t    \t<OverflowToolbar id="footerToolbar">\r\n\t\t\t\t<ToolbarSpacer id="footerBeginSpacer" />\r\n\t\t\t\t<Button id="saveButton" text="{i18n>xbut.save}" press="onSavePressed"/>\r\n\t\t\t\t<Button id="cancelButton" text="{i18n>xbut.cancel}" press="onCancelPressed"/>\r\n\t\t\t\t<Button id="shareButton" icon="sap-icon://action"  press="onSharePressed"/>\r\n\t\t\t</OverflowToolbar>\r\n\t\t</footer>\t\t\r\n\t</Page>\r\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/ProductFilterDialog.fragment.xml":'<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">\r\n\t<ViewSettingsDialog id="filterSettingsDialog" confirm="onFilterDialogConfirm">\r\n\t\t<filterItems>\r\n\t\t\t<ViewSettingsFilterItem id="availibilityFilterItem" text="{i18n>xfld.availability}" key="Availibility" >\r\n\t\t\t\t<items>\r\n\t\t\t\t\t<ViewSettingsItem id="outofstockItem" text="{i18n>xfld.outstock}" key="outofstock" />\r\n\t\t\t\t\t<ViewSettingsItem id="restrictedstockItem" text="{i18n>xfld.restricted10}" key="restrictedstock" />\r\n\t\t\t\t\t<ViewSettingsItem id="instockItem" text="{i18n>xfld.instock}" key="instock" />\r\n\t\t\t\t</items>\r\n\t\t\t</ViewSettingsFilterItem>\r\n\t\t\t<ViewSettingsFilterItem id="priceFilterItem" text="{/#Product/Price/@sap:label}" key="Price" >\r\n\t\t\t\t<items>\r\n\t\t\t\t\t<ViewSettingsItem id="le100Item" text="{viewProperties>/LE100}" key="LE100" />\r\n\t\t\t\t\t<ViewSettingsItem id="bt100-500Item" text="{viewProperties>/BT100-500}" key="BT100-500" />\r\n\t\t\t\t\t<ViewSettingsItem id="bt500-1000Item" text="{viewProperties>/BT500-1000}" key="BT500-1000" />\r\n\t\t\t\t\t<ViewSettingsItem id="gt1000Item" text="{viewProperties>/GT1000}" key="GT1000" />\r\n\t\t\t\t</items>\r\n\t\t\t</ViewSettingsFilterItem>\r\n\t\t</filterItems>\r\n\t</ViewSettingsDialog>\r\n</core:FragmentDefinition>',
	"nw/epm/refapps/ext/prod/manage/view/ProductGroupingDialog.fragment.xml":'<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">\r\n\t<ViewSettingsDialog id="groupingSettingsDialog" confirm="onGroupingDialogConfirmed">\r\n\t\t<groupItems>\r\n\t\t\t<ViewSettingsItem id="mainCategoryGroupItem" text="{/#Product/MainCategoryName/@sap:label}" key="MainCategoryName" />\r\n\t\t\t<ViewSettingsItem id="subCategoryGroupItem" text="{/#Product/SubCategoryName/@sap:label}" key="SubCategoryName" />\r\n\t\t\t<ViewSettingsItem id="availibilityGroupItem"  text="{i18n>xfld.availability}" key="StockQuantity" />\r\n\t\t\t<ViewSettingsItem id="priceGroupItem"  text="{/#Product/Price/@sap:label}" key="Price" />\r\n\t\t</groupItems>\r\n\t</ViewSettingsDialog>\r\n</core:FragmentDefinition>',
	"nw/epm/refapps/ext/prod/manage/view/ProductSortDialog.fragment.xml":'<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">\r\n\t<ViewSettingsDialog id="sortSettingsDialog" confirm="onSortDialogConfirmed">\r\n\t\t<sortItems>\r\n\t\t\t<ViewSettingsItem id="nameSortItem" text="{/#Product/Name/@sap:label}" key="Name" />\r\n\t\t\t<ViewSettingsItem id="idSortItem" text="{/#Product/Id/@sap:label}" key="Id" />\r\n\t\t\t<ViewSettingsItem id="priceSortItem" text="{/#Product/Price/@sap:label}" key="Price" />\r\n\t\t\t<ViewSettingsItem id="mainCategorySortItem" text="{/#Product/MainCategoryName/@sap:label}" key="MainCategoryName" />\r\n\t\t\t<ViewSettingsItem id="subCategorySortItem" text="{/#Product/SubCategoryName/@sap:label}" key="SubCategoryName" />\r\n\t\t\t<ViewSettingsItem id="availabilitySortItem" text="{i18n>xfld.availability}" key="StockQuantity" />\r\n\t\t</sortItems>\r\n\t</ViewSettingsDialog>\r\n</core:FragmentDefinition>',
	"nw/epm/refapps/ext/prod/manage/view/S2_ProductMaster.view.xml":'<mvc:View \r\n    xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" \r\n    controllerName="nw.epm.refapps.ext.prod.manage.controller.S2_ProductMaster"\r\n    busy="{= ${appProperties>/isListLoading}  &amp;&amp; !${appProperties>/isBusy} }"\r\n    busyIndicatorDelay="{appProperties>/masterBusyIndicatorDelay}" >\r\n\t\r\n\t<Page id="masterPage" title="{viewProperties>/title}" showNavButton="true" navButtonPress="onNavButtonPress">\r\n        <headerContent>\r\n            <Button id="multiSelectButton" icon="{= ${appProperties>/isMultiSelect} ? \'sap-icon://sys-cancel\' : \'sap-icon://multi-select\' }" \r\n                press="onMultiSelectPressed" \r\n                enabled="{= ${appProperties>/noEditMode} &amp;&amp; ${appProperties>/lostDraftReadState} === 1 }"/>\r\n        </headerContent>\r\n\r\n\t\t<subHeader>\r\n\t\t\t<Toolbar id="searchToolbar">\r\n\t\t\t    <!--Search field which triggers a (filtered) backend search.\r\n\t\t\t        On desktop this control also provides an option to refresh the list. \r\n\t\t\t        On non desktop devices the pull to refresh control (see below) is used for that -->\r\n\t\t\t\t<SearchField id="SearchField" showRefreshButton="{= !${device>/support/touch} }"\r\n\t\t\t\t\tsearch="onSearch" width="100%"/>\r\n\t\t\t</Toolbar>\r\n\t\t</subHeader>\r\n\t\t\r\n\t\t<content>\r\n\t\t    <!-- On non desktop devices the user triggers the list refresh by pulling down the list (pull to refresh) -->\r\n\t\t    <PullToRefresh id="pullToRefresh" visible="{device>/support/touch}" refresh="onPullToRefresh" />\r\n\r\n\t\t    <!--List of purchase orders that need to be approved. The list entries contain the information supplier name, total value, requester, change date and number of items-->\r\n\t\t    <!-- Note that the select defined for the list items ensures, that all attributes that are required on S3 view are loaded already here -->\r\n\t\t\t<List\r\n\t\t\t\tid="list" selectionChange="onItemSelect" modeAnimationOn="false" includeItemInSelection="true" \r\n\t\t\t\tmode="{= ${appProperties>/isMultiSelect} ? \'MultiSelect\' : (${device>/system/phone} ? \'None\' : \'SingleSelectMaster\') }"\r\n\t\t\t\tgrowing="true" growingScrollToLoad="true" updateFinished="onUpdateFinished" updateStarted="onUpdateStarted"\r\n\t\t\t\tnoDataText="{appProperties>/listNoDataText}" swipe="onSwipe"\r\n\t\t\t\tenableBusyIndicator="false"\r\n                items="{path: \'/Products\',\r\n\t\t\t\t\t\tsorter: {path: \'Name\', descending: false},\r\n\t\t\t\t\t\tgroupHeaderFactory: \'.createGroupHeader\',\r\n\t\t\t\t\t\tparameters: {countMode: \'Inline\', \r\n\t\t\t\t\t\tselect: \'Id,ImageUrl,Name,Price,CurrencyCode,SubCategoryName,MainCategoryName,QuantityUnit,StockQuantity\'}}">\r\n\t\t\t\t<ObjectListItem\r\n\t\t\t\t\tid="objectListItem" type="{= ${device>/system/phone} ? \'Active\' : \'Inactive\'}" press="onItemSelect" \r\n\t\t\t\t\ticon="{ImageUrl}" iconDensityAware="false" title="{Name}" numberUnit="{CurrencyCode}"\r\n\t\t\t\t\tnumber="{path:\'Price\', formatter: \'.formatter.formatAmount\'}" >\r\n\t\t\t\t\t<attributes>\r\n\t\t\t\t\t\t<ObjectAttribute id="mainCategoryAttribute" text="{MainCategoryName}" />\r\n\t\t\t\t\t\t<ObjectAttribute id="subCategoryAttribute" text="{SubCategoryName}" />\r\n\t\t\t\t\t</attributes>\r\n\t\t\t\t</ObjectListItem>\r\n\t\t\t\t<infoToolbar>\r\n\t\t\t\t\t<Toolbar id="filterToolbar" visible="{viewProperties>/filterToolbarVisible}">\r\n\t\t\t\t\t\t<Label id="filterInfoLabel" text="{viewProperties>/filterInfoText}" />\r\n\t\t\t\t\t</Toolbar>\r\n\t\t\t\t</infoToolbar>\r\n\t\t\t\t<swipeContent>\r\n\t\t\t\t\t<Button id="swipeButton" text="{i18n>xbut.delete}" type="Reject" press="onSwipeDeleteItem" />\r\n\t\t\t\t</swipeContent>\r\n\t\t\t</List>\r\n\t\t</content>\r\n\t\t\r\n\t\t<!--Empty footer bar to align with the footer bar of the detail view-->\r\n\t\t<footer>\r\n\t\t\t<OverflowToolbar id="footerToolbar">\r\n\t\t\t\t<ToolbarSpacer id="footerBeginSpacer"/>\r\n\t\t\t\t<Button id="deleteButton" text="{i18n>xbut.delete}" visible ="{appProperties>/isMultiSelect}" enabled ="{viewProperties>/markExists}" press="onDeletePressed" />\r\n\t\t\t\t<OverflowToolbarButton id="sortButton" icon="sap-icon://sort" text="{i18n>xbut.sort}" tooltip="{i18n>xbut.sort}"\r\n\t\t\t\t\t    enabled ="{= ${appProperties>/noEditMode} &amp;&amp; ${appProperties>/metaDataLoadState} === 1}" press="onSortPressed" />\r\n\t\t\t\t<OverflowToolbarButton id="filterButton" icon="sap-icon://filter" text="{i18n>xbut.filter}" tooltip="{i18n>xbut.filter}"\r\n\t\t\t\t\t    enabled ="{= ${appProperties>/noEditMode} &amp;&amp; ${appProperties>/metaDataLoadState} === 1}" press="onFilterPressed" />\r\n\t\t\t\t<OverflowToolbarButton id="groupButton" icon="sap-icon://group-2" text="{i18n>xbut.group}"  tooltip="{i18n>xbut.group}"\r\n\t\t\t\t\t    enabled ="{= ${appProperties>/noEditMode} &amp;&amp; ${appProperties>/metaDataLoadState} === 1}" press="onGroupPressed" />\r\n\t\t\t\t<OverflowToolbarButton id="addButton" icon="sap-icon://add" text="{i18n>xbut.add}" visible ="{= !${appProperties>/isMultiSelect}}"  \r\n\t\t\t\t\t\ttooltip="{i18n>xbut.add}" enabled ="{= ${appProperties>/noEditMode} &amp;&amp; ${appProperties>/lostDraftReadState} === 1}" press="onAddPressed" />\r\n\t\t\t</OverflowToolbar>\r\n\t\t</footer>\r\n\t</Page>\r\n\t\r\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/S3_ProductDetail.view.xml":'<mvc:View xmlns="sap.m" xmlns:core="sap.ui.core" xmlns:mvc="sap.ui.core.mvc" controllerName="nw.epm.refapps.ext.prod.manage.controller.S3_ProductDetail">\r\n\t<NavContainer id="content" defaultTransitionName="show" >\r\n        <mvc:XMLView id="display" viewName="nw.epm.refapps.ext.prod.manage.view.ProductDisplay" displayBlock="true" height="100%" />\r\n        <mvc:XMLView id="edit" viewName="nw.epm.refapps.ext.prod.manage.view.ProductEdit" displayBlock="true" height="100%" />\r\n\t</NavContainer>\r\n</mvc:View>',
	"nw/epm/refapps/ext/prod/manage/view/ShareSheet.fragment.xml":'<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core" xmlns:footerbar="sap.ushell.ui.footerbar" >\r\n  <ActionSheet id="shareSheet" showCancelButton="true" placement="Top">\r\n    <buttons>\r\n        <Button id="emailButton" icon="sap-icon://email" text="{i18n>xbut.email}" press="onEmailPressed" enabled="{viewProperties>/dataLoaded}" />\r\n        <footerbar:AddBookmarkButton id="bookmarkButton" appData="{path:\'Name\', formatter: \'.formatter.appDataForTile\'}" />\r\n      </buttons>\r\n  </ActionSheet>\r\n</core:FragmentDefinition>',
	"nw/epm/refapps/ext/prod/manage/view/SupplierCard.fragment.xml":'<core:FragmentDefinition xmlns="sap.m" xmlns:core="sap.ui.core">\r\n   <QuickView id="companyQuickView">\r\n      <QuickViewPage\r\n            header="{i18n>xtit.supplier}"\r\n            icon="sap-icon://account"\r\n            title="{Name}"\r\n            description="{FormattedContactName}" >\r\n         <QuickViewGroup heading="{i18n>xtit.contactDetails}">\r\n            <QuickViewGroupElement\r\n                  label="{/#Supplier/Phone/@sap:label}"\r\n                  value="{Phone}"\r\n                  type="phone" />\r\n            <QuickViewGroupElement\r\n                  label="{/#Supplier/FormattedAddress/@sap:label}"\r\n                  value="{FormattedAddress}" />                  \r\n         </QuickViewGroup>\r\n         <QuickViewGroup heading="{i18n>xtit.mainContact}">\r\n            <QuickViewGroupElement\r\n                  label="{/#Supplier/FormattedContactName/@sap:label}"\r\n                  value="{FormattedContactName}" />\r\n            <QuickViewGroupElement\r\n                  label="{/#Supplier/ContactPhone2/@sap:label}"\r\n                  value="{ContactPhone2}" \r\n                  type="mobile" />\r\n            <QuickViewGroupElement\r\n                  label="{/#Supplier/ContactPhone1/@sap:label}"\r\n                  value="{ContactPhone1}" \r\n                  type="phone" />\r\n            <QuickViewGroupElement\r\n                  label="{/#Supplier/ContactEmail/@sap:label}"\r\n                  value="{ContactEmail}" \r\n                  type="email" />                      \r\n         </QuickViewGroup>         \r\n      </QuickViewPage>\r\n   </QuickView>\r\n</core:FragmentDefinition>'
}});
