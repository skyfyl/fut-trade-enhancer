import { getValue, setValue, getDataSource } from "../services/repository";
import { t } from "../services/translate";
import { fetchPrices } from "../services/datasource";
import {
  generateAfterTaxInfo,
  generateCalcMinBin,
  generateListForFutBinBtn,
  generateViewOnFutBinBtn,
} from "../utils/uiUtils/generateElements";

import {
  getSellBidPrice
} from "../utils/priceUtil";

import {
  listCards,
} from "../utils/relistUtil";

import { getSellPrice } from "../utils/sellUtil";

import { sendUINotification } from "../utils/notificationUtil";

export const playerViewPanelOverride = () => {
  const calcTaxPrice = (buyPrice) => {
    const priceAfterTax = (buyPrice * 0.95).toLocaleString();
    $("#saleAfterTax").html(`${t("price")} ${priceAfterTax}`);
  };

  const utInit = UTQuickListPanelView.prototype.init;
  const buyPriceChanged = UTQuickListPanelView.prototype.onBuyPriceChanged;
  const quickListPanelGenerate = UTQuickListPanelView.prototype._generate;
  const defaultActionPanelGenerate =
    UTDefaultActionPanelView.prototype._generate;
  const auctionActionPanelGenerate =
    UTAuctionActionPanelView.prototype._generate;
  const quickPanelRenderView =
    UTQuickListPanelViewController.prototype.renderView;

  UTQuickListPanelView.prototype.init = function () {
    utInit.call(this);
    this._inputFutBinPriceButton.init(),
    this._inputFutBinPriceButton.setText('Input FutBin Price'),
    this._inputFutBinPriceButton.addTarget(this, this._inputFutBinPrice, EventType.TAP)

    this._sellAllSamePlayersButton.init(),
    this._sellAllSamePlayersButton.setText('Sell AllSame Players Price'),
    this._sellAllSamePlayersButton.addTarget(this, this._listAllSamePlayers, EventType.TAP)
  };

  UTQuickListPanelView.prototype.onBuyPriceChanged = function (e, t, i) {
    buyPriceChanged.call(this, e, t, i);
    calcTaxPrice(this._buyNowNumericStepper.getValue());
  };

  UTQuickListPanelView.prototype._inputFutBinPrice = function () {
    const dataSource = getDataSource();
    const card =
      getValue("selectedPlayer") || getValue("selectedNonPlayer");
    if (!card) {
      return;
    }

    fetchPrices([card]).then(value => {

      const existingValue = getValue(`${card.definitionId}_${dataSource}_price`);
      if (existingValue && existingValue.price) {

        getSellPrice(existingValue.price, card).then(([isRight, sellPrice]) => {

          console.log('sellPrice: ' + sellPrice)
          let bidPrice = getSellBidPrice(sellPrice);

          this._bidNumericStepper.setValue(bidPrice);
          this._buyNowNumericStepper.setValue(sellPrice);
        });
      }

    });
  };

  UTQuickListPanelView.prototype._listAllSamePlayers = function () {
    const card =
        getValue("selectedPlayer") || getValue("selectedNonPlayer");
      if (!card) {
        return;
      }

      services.Item.requestTransferItems().observe(
        this,
        function (t, response) {
          const unSoldItems = response.response.items.filter(function (item) {
            return (
              card.definitionId === item.definitionId
            );
          });
          const price = parseInt(this._buyNowNumericStepper.getValue());
          const startPrice = parseInt(this._bidNumericStepper.getValue());
          console.log('price: ' + price);
          console.log('startPrice: ' + startPrice);

          listCards(unSoldItems, price, startPrice, false).then(value => {
            sendUINotification('Sell AllSame Players Price Count: ' + unSoldItems.length);
          });
        }
      );
  };

  UTQuickListPanelView.prototype.initFutBinEvent = function (e) {
    if (e.type !== "player") {
      $(this._futbinListFor.__root).css("display", "none");
      setTimeout(() => {
        $(".viewon").css("display", "none");
      });
      setValue("selectedPlayer", undefined);
      setValue("selectedNonPlayer", e);
      return;
    }
    $(this._futbinListFor.__root).css("display", "");
    setTimeout(() => {
      $(".viewon").css("display", "");
    });
    setValue("selectedPlayer", e);
    setValue("selectedNonPlayer", undefined);
  };

  UTQuickListPanelView.prototype._generate = function (...args) {
    if (!this._generated) {
      quickListPanelGenerate.call(this, ...args);
      this._futbinListFor = generateListForFutBinBtn();
      this.__root.children[0].appendChild(this._futbinListFor.__root);
      generateAfterTaxInfo().insertAfter($(this._buyNowNumericStepper.__root));

      this._inputFutBinPriceButton = new UTStandardButtonControl,
      this._inputFutBinPriceButton.getRootElement().classList.add("call-to-action");
      this.__panelActions.appendChild(this._inputFutBinPriceButton.getRootElement());

      this._sellAllSamePlayersButton = new UTStandardButtonControl,
      this._sellAllSamePlayersButton.getRootElement().classList.add("call-to-action");
      this.__panelActions.appendChild(this._sellAllSamePlayersButton.getRootElement());

    }
  };

  UTQuickListPanelViewController.prototype.renderView = function () {
    quickPanelRenderView.call(this);
    let e = this.getView();
    e.initFutBinEvent(this.item);
  };

  UTDefaultActionPanelView.prototype._generate = function (...args) {
    if (!this._generated) {
      defaultActionPanelGenerate.call(this, ...args);
      insertActionButtons.call(this);
    }
  };

  UTAuctionActionPanelView.prototype._generate = function (...args) {
    if (!this._generated) {
      auctionActionPanelGenerate.call(this, ...args);
      insertActionButtons.call(this);
    }
  };

  const insertActionButtons = function () {
    $(generateViewOnFutBinBtn().__root).insertAfter(
      $(this._playerBioButton.__root)
    );
    const showCalcMinBin = getValue("EnhancerSettings")["idShowCalcMinBin"];
    if (showCalcMinBin) {
      this._calcMinBin = generateCalcMinBin();
      const childrenCount = this.__root.children.length;
      this.__root.children[childrenCount - 1].appendChild(
        this._calcMinBin.__root
      );
    }
  };
};
