/* global QUnit, sinon */
sap.ui.define([
	"sap/ui/mdc/util/IdentifierUtil","sap/ui/mdc/p13n/FlexUtil","sap/ui/mdc/Table", "sap/ui/mdc/Chart", "sap/ui/mdc/TableDelegate", "sap/ui/mdc/table/TableSettings", "sap/ui/mdc/chart/ChartSettings", "sap/ui/mdc/FilterBar", "sap/ui/mdc/p13n/AdaptationController", "sap/m/Button", "sap/ui/mdc/table/Column","sap/ui/mdc/chart/DimensionItem", "sap/ui/mdc/chart/MeasureItem", "sap/ui/mdc/FilterField"
], function (IdentifierUtil, FlexUtil, Table, Chart, TableDelegate, TableSettings, ChartSettings, FilterBar, AdaptationController, Button, Column, Dimension, Measure, FilterField) {
	"use strict";
	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");

	QUnit.module("AdaptationController API tests showP13n Table", {
		beforeEach: function () {
			this.oTable = new Table("TestTabl", {
				columns: [
					new Column("col1",{
						header:"col1",
						dataProperties: ["col1"]
					}),
					new Column("col2",{
						header:"col2",
						dataProperties: ["col2"]
					})
				]
			});
			this.oTable.setP13nMode(["Column","Sort","Filter"]);
			this.oAdaptationController = TableSettings._getAdaptationController(this.oTable);
			this.oAdaptationController.oAdaptationControlDelegate = TableDelegate;//necessary as the "getCurrentState" is in TableDelegate + retrieve in AC is stubbed
			var aColumns = this.oTable.getColumns();

			//mock delegate data
			this.aPropertyInfo = [
				{
					"name": aColumns[0].getDataProperties()[0],
					"path": "nav/" + aColumns[0].getDataProperties()[0],
					"id": aColumns[0].getId(),
					"label": aColumns[0].getHeader(),
					"sortable": true
				}, {
					"name": aColumns[1].getDataProperties()[0],
					"path": "nav/" + aColumns[1].getDataProperties()[0],
					"id": aColumns[1].getId(),
					"label": aColumns[1].getHeader(),
					"sortable": true
				}
			];

			//no delegate in Test --> Stub property info call
			var oPropertyInfoPromise = new Promise(function(resolve,reject){
				resolve(this.aPropertyInfo );
			}.bind(this));

			//stub '_retrievePropertyInfo'
			sinon.stub(this.oAdaptationController, "_retrievePropertyInfo").returns(oPropertyInfoPromise);
		},
		afterEach: function () {
			this.oTable.destroy();
			this.oAdaptationController.destroy();
		}
	});

	QUnit.test("Check 'AdaptationController' instantiation", function(assert) {
		assert.ok(this.oAdaptationController,"AdaptationController has been instantiated");
		assert.ok(this.oAdaptationController.oAdaptationModel,"inner model has been created");
		assert.ok(this.oAdaptationController.oAdaptationModel.iSizeLimit, 10000, "inner model size limit has been adjusted");
		assert.ok(!this.oAdaptationController.bIsDialogOpen, "dialog is not open");
	});

	QUnit.test("liveMode true", function (assert) {
		var done = assert.async();
		var oBtn = new Button();

		this.oAdaptationController.showP13n(oBtn, "Item").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(oP13nControl.isA("sap.m.ResponsivePopover"));
			assert.equal(oP13nControl.getTitle(), oResourceBundle.getText("table.SETTINGS_COLUMN"), "Correct title has been set");
			assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.SelectionPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");
			assert.equal(oInnerTable.getItems().length, this.aPropertyInfo.length, "correct amount of items has been set");
			done();
		}.bind(this));
	});

	QUnit.test("liveMode false", function (assert) {
		var done = assert.async();
		var oBtn = new Button();
		this.oAdaptationController.setLiveMode(false);

		this.oAdaptationController.showP13n(oBtn, "Item").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(oP13nControl.isA("sap.m.Dialog"));
			assert.equal(oP13nControl.getTitle(), oResourceBundle.getText("table.SETTINGS_COLUMN"), "Correct title has been set");
			assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.SelectionPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");
			assert.equal(oInnerTable.getItems().length, this.aPropertyInfo.length, "correct amount of items has been set");
			done();
		}.bind(this));
	});

	QUnit.test("open filter dialog", function (assert) {
		var done = assert.async();
		var oBtn = new Button();

		this.oTable.initialized().then(function(){
			TableSettings._setFilterConfig(this.oTable).then(function(oP13nFilter){
				this.oAdaptationController.showP13n(oBtn, "Filter").then(function(oP13nControl){

					//check container
					assert.ok(oP13nControl, "Container has been created");
					assert.ok(oP13nControl.isA("sap.m.ResponsivePopover"));
					assert.equal(oP13nControl.getTitle(), oResourceBundle.getText("filter.PERSONALIZATION_DIALOG_TITLE"), "Correct title has been set");
					assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

					//check inner Control
					assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.filterbar.p13n.AdaptationFilterBar"), "Correct control created");

					//check that inner oP13nFilter is an IFilter
					assert.ok(oP13nFilter.isA("sap.ui.mdc.IFilter"));
					done();
				}.bind(this));
			}.bind(this));
		}.bind(this));
	});

	QUnit.test("create filter control for personalization", function (assert) {
		var done = assert.async();

		this.oAdaptationController.createP13n("Item", [this.aPropertyInfo[0]]).then(function(oP13nControl){
			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(oP13nControl.isA("sap.m.ResponsivePopover"));

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.SelectionPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");
			assert.equal(oInnerTable.getItems().length, 1, "only one item has been created (as only one has been passed as parameter)");
			done();
		});
	});

	QUnit.test("_handleChange callback execution",function(assert){
		var done = assert.async();

		//first we need to open the settings dialog to ensure that all models have been prepared
		this.oAdaptationController.showP13n(this.oTable, "Item").then(function(oP13nControl){

			//trigger event handler manually --> usually triggered by user interaction
			//user interaction manipulates the inner model of the panel,
			//to mock user interaction we directly act the change on the p13n panel model
			var aItems = this.oAdaptationController.oAdaptationModel.getData().items;
			aItems.pop(); //remove one item to trigger a change
			this.oAdaptationController.oAdaptationModel.setProperty("/items",aItems);

			this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
				assert.ok(aChanges,"event has been executed");
				assert.equal(aChanges.length, 1, "correct amounf oc changes has been created");

				//check that only required information is present in the change content
				var oChangeContent = aChanges[0].changeSpecificData.content;
				assert.ok(oChangeContent.name);
				assert.ok(!oChangeContent.hasOwnProperty("descending"));
			});

			this.oAdaptationController._handleChange();
			done();
		}.bind(this));

	});

	QUnit.test("check that according hook will be called with the 'name' as key",function(assert){
		var done = assert.async();

		//first we need to open the settings dialog to ensure that all models have been prepared
		this.oAdaptationController.showP13n(this.oTable, "Item").then(function(oP13nControl){

			//trigger event handler manually --> usually triggered by user interaction
			//user interaction manipulates the inner model of the panel,
			//to mock user interaction we directly act the change on the p13n panel model
			var aItems = this.oAdaptationController.oAdaptationModel.getData().items;

			aItems.pop();

			this.oAdaptationController.oAdaptationModel.setProperty("/items",aItems);

			this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
				assert.ok(aChanges,"event has been executed");
				assert.equal(aChanges.length, 1, "correct amounf oc changes has been created");

				//check that only required information is present in the change content
				var oChangeContent = aChanges[0].changeSpecificData.content;
				assert.equal(oChangeContent.name, this.aPropertyInfo[1].name, "The stored key should be equal to the 'name' in property info (NOT PATH!)");
				done();
			}.bind(this));

			this.oAdaptationController._handleChange();

		}.bind(this));

	});

	QUnit.test("check with 'Sort'", function (assert) {
		var done = assert.async();
		var oBtn = new Button();

		this.oAdaptationController.showP13n(oBtn, "Sort").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.SortPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");
			assert.equal(oInnerTable.getItems().length, this.aPropertyInfo.length, "correct amount of items has been set");
			done();
		}.bind(this));
	});

	QUnit.test("check with 'Sort' +  non sortable properties", function (assert) {
		var done = assert.async();
		var oBtn = new Button();
		this.aPropertyInfo[0].sortable = false;

		this.oAdaptationController.showP13n(oBtn, "Sort").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.SortPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");

			//-1 non sortable property
			assert.equal(oInnerTable.getItems().length, this.aPropertyInfo.length - 1, "correct amount of items has been set");
			done();
		}.bind(this));
	});

	QUnit.test("use 'createSortChanges' to create changes without UI panel", function (assert) {
		var done = assert.async();
		this.aPropertyInfo[0].sortable = false;

		var aP13nData = [
			{name:"col2", descending: true}
		];

		this.oAdaptationController.createSortChanges(aP13nData, true).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 1, "one change created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "addSort", "once sort change created");
			done();
		});

	});

	QUnit.test("use 'createItemChanges' to create changes without UI panel (create new columns)", function(assert){
		var done = assert.async();

		var aP13nData = [
			{name:"col3", position: 2},
			{name:"col4", position: 3}
		];

		this.oAdaptationController.createItemChanges(aP13nData).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 2, "one change created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "addColumn", "once column change created");
			assert.equal(aChanges[1].changeSpecificData.changeType, "addColumn", "once column change created");
			done();
		});
	});

	QUnit.test("use 'createItemChanges' to create changes without UI panel (remove non present column)", function(assert){
		var done = assert.async();

		var aP13nData = [
			{name:"col3", position: 2},
			{name:"col4", visible: false}// column is not present, so no change should be created
		];

		this.oAdaptationController.createItemChanges(aP13nData).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 1, "one change created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "addColumn", "once column change created");
			done();
		});
	});

	QUnit.test("use 'createItemChanges' to create changes without UI panel (remove existing column)", function(assert){
		var done = assert.async();

		var aP13nData = [
			{name:"col1", visible: false}
		];

		this.oAdaptationController.createItemChanges(aP13nData).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 1, "one change created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "removeColumn", "once column change created");
			done();
		});
	});

	QUnit.test("use 'createItemChanges' to create changes without UI panel (move existing column)", function(assert){
		var done = assert.async();

		var aP13nData = [
			{name:"col1", position: 1}//position changed
		];

		this.oAdaptationController.createItemChanges(aP13nData).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 1, "one change created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "moveColumn", "once column change created");
			done();
		});
	});

	QUnit.module("AdaptationController API tests showP13n Chart", {
		beforeEach: function () {
			this.oChart = new Chart("TestChart", {
				items: [
					new Dimension("item1",{
						header:"item1",
						key:"item1"
					}),
					new Measure("item2",{
						header:"item2",
						key:"item2"
					})
				]
			});
			this.oAdaptationController = ChartSettings._getAdaptationController(this.oChart);

			var aItems = this.oChart.getItems();

			//mock delegate data
			this.aPropertyInfo = [
				{
					"name": aItems[0].getKey()[0],
					"id": aItems[0].getId(),
					"label": aItems[0].getLabel()
				}, {
					"name": aItems[1].getKey()[0],
					"id": aItems[1].getId(),
					"label": aItems[1].getLabel()
				}
			];

			//no delegate in Test --> Stub property info call
			var oPropertyInfoPromise = new Promise(function(resolve,reject){
				resolve(this.aPropertyInfo );
			}.bind(this));

			//stub '_retrievePropertyInfo'
			sinon.stub(this.oAdaptationController, "_retrievePropertyInfo").returns(oPropertyInfoPromise);
		},
		afterEach: function () {
			this.oChart.destroy();
			this.oAdaptationController.destroy();
		}
	});

	QUnit.test("use ChartItemPanel", function (assert) {
		var done = assert.async();
		var oBtn = new Button();

		this.oAdaptationController.showP13n(oBtn, "Item").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(oP13nControl.isA("sap.m.ResponsivePopover"));
			assert.equal(oP13nControl.getTitle(), oResourceBundle.getText("chart.PERSONALIZATION_DIALOG_TITLE"), "Correct title has been set");
			assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.ChartItemPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");
			assert.equal(oInnerTable.getItems().length, this.aPropertyInfo.length, "correct amount of items has been set");
			done();
		}.bind(this));
	});

	QUnit.module("AdaptationController API tests showP13n FilterBar", {
		beforeEach: function () {
			this.oFilterBar = new FilterBar("TestFB", {
				filterItems: [
					new FilterField("item1",{
						label:"item1",
						conditions: "{$filters>/conditions/item1}"
					}),
					new FilterField("item2",{
						label:"item2",
						conditions: "{$filters>/conditions/item2}"
					})
				]
			});
			this.oAdaptationController = this.oFilterBar._getAdaptationController();

			var aItems = this.oFilterBar.getFilterItems();

			//mock delegate data
			this.aPropertyInfo = [
				{
					"name": "item1",
					"id": aItems[0].getId(),
					"label": aItems[0].getLabel()
				}, {
					"name": "item2",
					"id": aItems[1].getId(),
					"label": aItems[1].getLabel()
				}, {
					"name": "item3",
					"label": aItems[1].getLabel()
				}
			];

			//no delegate in Test --> Stub property info call
			var oPropertyInfoPromise = new Promise(function(resolve,reject){
				this.oAdaptationController.aPropertyInfo = this.aPropertyInfo;
				resolve(this.aPropertyInfo);
			}.bind(this));

			//stub '_retrievePropertyInfo'
			sinon.stub(this.oAdaptationController, "_retrievePropertyInfo").returns(oPropertyInfoPromise);
		},
		afterEach: function () {
			this.oFilterBar.destroy();
			this.oAdaptationController.destroy();
		}
	});

	QUnit.test("Custom 'retrievePropertyInfo' should not take $search into account for FilterBar", function(assert){
		var done = assert.async();

		var aMockProperties = [
			{name:"Test1"},
			{name:"Test2"},
			{name:"Test3"},
			{name:"Test4"},
			{name:"$search"}
		];

		this.oFilterBarNonStub = new FilterBar();
		this.oFilterBarNonStub._aProperties = aMockProperties;
		this.oNonStubAC = this.oFilterBarNonStub._getAdaptationController();

		var oBtn = new Button();

		this.oNonStubAC.showP13n(oBtn, "Item").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(oP13nControl.isA("sap.m.ResponsivePopover"));
			assert.equal(oP13nControl.getTitle(), oResourceBundle.getText("filterbar.ADAPT_TITLE"), "Correct title has been set");
			assert.ok(this.oNonStubAC.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.AdaptFiltersPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");

			//we do not want to see the basic search field
			assert.equal(oInnerTable.getItems().length, aMockProperties.length - 1, "correct amount of items has been set");
			this.oFilterBarNonStub.destroy();
			this.oFilterBarNonStub = null;
			this.oNonStubAC = null;
			done();
		}.bind(this));

	});

	QUnit.test("use AdaptFiltersPanel", function (assert) {
		var done = assert.async();
		var oBtn = new Button();

		this.oAdaptationController.showP13n(oBtn, "Item").then(function(oP13nControl){

			//check container
			assert.ok(oP13nControl, "Container has been created");
			assert.ok(oP13nControl.isA("sap.m.ResponsivePopover"));
			assert.equal(oP13nControl.getTitle(), oResourceBundle.getText("filterbar.ADAPT_TITLE"), "Correct title has been set");
			assert.ok(this.oAdaptationController.bIsDialogOpen,"dialog is open");

			//check inner panel
			var oInnerTable = oP13nControl.getContent()[0]._oMTable;
			assert.ok(oP13nControl.getContent()[0].isA("sap.ui.mdc.p13n.panels.AdaptFiltersPanel"), "Correct panel created");
			assert.ok(oInnerTable, "Inner Table has been created");
			assert.equal(oInnerTable.getItems().length, this.aPropertyInfo.length, "correct amount of items has been set");
			done();
		}.bind(this));
	});

	QUnit.test("create condition changes via 'createConditionChanges'", function(assert){
		var done = assert.async();

		var mConditions = {
			item1: [{operator: "EQ", values:["Test"]}],
			item2: [{operator: "EQ", values:["Test"]}],
			item3: [{operator: "EQ", values:["Test"]}]
		};

		this.oAdaptationController.createConditionChanges(mConditions).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 3, "three changes created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "addCondition", "one condition change created");
			assert.equal(aChanges[1].changeSpecificData.changeType, "addCondition", "one condition change created");
			assert.equal(aChanges[2].changeSpecificData.changeType, "addCondition", "one condition change created");
			done();
		});

	});

	QUnit.test("create condition changes via 'createConditionChanges' with initial filterConditions", function(assert){
		var done = assert.async();

		var mConditions = {
			item1: [{operator: "EQ", values:["Test"]}],
			item2: [{operator: "EQ", values:["Test"]}],
			item3: [{operator: "EQ", values:["Test"]}]
		};

		sinon.stub(this.oFilterBar, "getPropertyInfoSet").returns(this.aPropertyInfo);
		this.oFilterBar.setFilterConditions({item1: [{operator: "EQ", values:["Test"]}]});

		this.oAdaptationController.createConditionChanges(mConditions).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 2, "three changes created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "addCondition", "one condition change created");
			assert.equal(aChanges[1].changeSpecificData.changeType, "addCondition", "one condition change created");
			done();
		});

	});

	QUnit.test("create condition changes via 'createConditionChanges' with initial filterConditions", function(assert){
		var done = assert.async();

		var mConditions = {
			item1: [],
			item2: [{operator: "EQ", values:["Test"]}],
			item3: [{operator: "EQ", values:["Test"]}]
		};

		sinon.stub(this.oFilterBar, "getPropertyInfoSet").returns(this.aPropertyInfo);
		this.oFilterBar.setFilterConditions({item1: [{operator: "EQ", values:["Test"]}]});

		this.oAdaptationController.createConditionChanges(mConditions).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 3, "three changes created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "removeCondition", "one condition change created");
			assert.equal(aChanges[1].changeSpecificData.changeType, "addCondition", "one condition change created");
			assert.equal(aChanges[2].changeSpecificData.changeType, "addCondition", "one condition change created");
			done();
		});

	});

	QUnit.test("create condition changes via 'createConditionChanges' and always consider $search", function(assert){
		var done = assert.async();

		var mConditions = {
			$search: [{operator: "EQ", values:["Test"]}]
		};

		sinon.stub(this.oFilterBar, "getPropertyInfoSet").returns(this.aPropertyInfo);
		this.oFilterBar.setFilterConditions({item1: [{operator: "EQ", values:["Test"]}]});

		this.oAdaptationController.createConditionChanges(mConditions).then(function(){
			assert.ok(true, "Callback triggered");
		});

		this.oAdaptationController.setProperty("afterChangesCreated", function(oAC, aChanges){
			assert.ok(aChanges, "changes created");
			assert.equal(aChanges.length, 1, "three changes created");
			assert.equal(aChanges[0].changeSpecificData.changeType, "addCondition", "one condition change created");
			done();
		});

	});

});
