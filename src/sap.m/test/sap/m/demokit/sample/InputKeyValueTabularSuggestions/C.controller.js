sap.ui.define([
		'sap/ui/core/Fragment',
		'sap/ui/core/mvc/Controller',
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		'sap/ui/model/json/JSONModel'
	], function(Fragment, Controller, Filter, FilterOperator, JSONModel) {
	"use strict";

	var CController = Controller.extend("sap.m.sample.InputKeyValueTabularSuggestions.C", {
		inputId: '',

		onInit: function () {
			// set explored app's demo model on this sample
			var oModel = new JSONModel(sap.ui.require.toUrl("sap/ui/demo/mock/products.json"));
			this.getView().setModel(oModel);

			var oInput = this.byId('productInput');
			oInput.setSuggestionRowValidator(this.suggestionRowValidator);
		},

		handleValueHelp : function (oController) {
			this.inputId = oController.oSource.sId;
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"sap.m.sample.InputKeyValueTabularSuggestions.Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}

			// open value help dialog
			this._valueHelpDialog.open();
		},

		_handleValueHelpSearch : function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"Name",
				FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose : function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},

		suggestionRowValidator: function (oColumnListItem) {
			var aCells = oColumnListItem.getCells();

			return new sap.ui.core.Item({
				key: aCells[1].getText(),
				text: aCells[0].getText()
			});
		},

		suggestionItemSelected: function (evt) {

			var oInput = this.byId('productInput'),
				oText = this.byId('selectedKey'),
				sKey = oInput.getSelectedKey();

			oText.setText(sKey);
		}
	});


	return CController;

});