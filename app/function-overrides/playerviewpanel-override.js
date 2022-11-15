import { getValue, setValue, getDataSource } from "../services/repository";
import { t } from "../services/translate";
import { fetchPrices } from "../services/datasource";
import {
  generateSellAllSamePlayersBtn,
  generateInputFutBinPriceBtn,
  generateAfterTaxInfo,
  generateCalcMinBin,
  generateListForFutBinBtn,
  generateViewOnFutBinBtn,
} from "../utils/uiUtils/generateElements";

import {
  generateButton,
} from "../utils/uiUtils/generateButton";

import {
  idInputFutBinPrice,
  idSellSamePlayerFutBinPrice
} from "../app.constants";

import {
  getSellBidPrice
} from "../utils/priceUtil";

import {
  listCards,
  computeSalePrice
} from "../utils/relistUtil";

import { getSellPrice } from "../utils/sellUtil";

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

  UTQuickListPanelView.prototype.onBuyPriceChanged = function (e, t, i) {
    buyPriceChanged.call(this, e, t, i);
    calcTaxPrice(this._buyNowNumericStepper.getValue());
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

      this._inputFutBinPriceButton = generateInputFutBinPriceBtn();
      this.__panelActions.appendChild(this._inputFutBinPriceButton.getRootElement());

      this._sellAllSamePlayersButton = generateSellAllSamePlayersBtn();
      this.__panelActions.appendChild(this._sellAllSamePlayersButton.getRootElement());
     
      // $(
      //   generateButton(
      //     idInputFutBinPrice,
      //     'Input FutBin Price',
      //     () => {
      //       const dataSource = getDataSource();
      //       const card =
      //         getValue("selectedPlayer") || getValue("selectedNonPlayer");
      //       if (!card) {
      //         return;
      //       }

      //       (async () => {
      //         await fetchPrices([card]);
      //       })();

      //       (async () => {
      //         const existingValue = getValue(`${card.definitionId}_${dataSource}_price`);
      //         if (existingValue && existingValue.price) {
      //           const [isRight, sellPrice] = await getSellPrice(computeSalePrice(existingValue.price), card);
      //           console.log('sellPrice: ' + sellPrice)
      //           const bidPrice = getSellBidPrice(sellPrice);
      //           this._bidNumericStepper.setValue(bidPrice);
      //           this._buyNowNumericStepper.setValue(sellPrice);
      //         }
      //       })();
      //     },
      //     "call-to-action"
      //   )
      // ).insertAfter($(this._listButton.__root));

      // $(
      //   generateButton(
      //     idSellSamePlayerFutBinPrice,
      //     'Sell AllSame FutBin Price',
      //     () => {
      //       // const dataSource = getDataSource();
      //       const card =
      //         getValue("selectedPlayer") || getValue("selectedNonPlayer");
      //       if (!card) {
      //         return;
      //       }

      //       (async () => {
      //         await fetchPrices([card]);
      //       })();

            
      //       services.Item.requestTransferItems().observe(
      //         this,
      //         async function (t, response) {
      //           const unSoldItems = response.response.items.filter(function (item) {
      //             return (
      //               card.definitionId === item.definitionId
      //             );
      //           });
      //           const price = parseInt(this._buyNowNumericStepper.getValue());
      //           const startPrice = parseInt(this._bidNumericStepper.getValue());
      //           console.log('price: ' + price);
      //           console.log('startPrice: ' + startPrice);

      //           await listCards(unSoldItems, price, startPrice, false);  
      //         }
      //       );

                  

      //       // (async () => {
      //       //   const existingValue = getValue(`${card.definitionId}_${dataSource}_price`);
      //       //   if (existingValue && existingValue.price) {
      //       //     const [isRight, sellPrice] = await getSellPrice(computeSalePrice(existingValue.price), card);
      //       //     this._bidNumericStepper.setValue(getSellBidPrice(sellPrice));
      //       //     this._buyNowNumericStepper.setValue(sellPrice);
      //       //   }
      //       // })();
      //     },
      //     "call-to-action"
      //   )
      // ).insertAfter($(this._listButton.__root));
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

  const inputFutBinPriceActionButtons = function (homeThis) {


    const dataSource = getDataSource();
    const card =
      getValue("selectedPlayer") || getValue("selectedNonPlayer");
    if (!card) {
      return;
    }

    (async () => {
      await fetchPrices([card]);
    })();

    (async () => {
      const existingValue = getValue(`${card.definitionId}_${dataSource}_price`);
      if (existingValue && existingValue.price) {
        const [isRight, sellPrice] = await getSellPrice(computeSalePrice(existingValue.price), card);
        homeThis._bidNumericStepper.setValue(getSellBidPrice(sellPrice));
        homeThis._buyNowNumericStepper.setValue(sellPrice);
      }
    })();


  };

  const sellAllSamePlayerFutBinPriceActionButtons = function (homeThis) {

    const dataSource = getDataSource();
    const card =
      getValue("selectedPlayer") || getValue("selectedNonPlayer");
    if (!card) {
      return;
    }

    (async () => {
      await fetchPrices([card]);
    })();

    services.Item.requestTransferItems().observe(
      this,
      async function (t, response) {
        let unSoldItems = response.response.items.filter(function (item) {
          return (
            card.definitionId === item.definitionId
          );
        });

        let price = parseInt(homeThis._buyNowNumericStepper.getValue());
        let startPrice = parseInt(homeThis._bidNumericStepper.getValue());
        await listCards(unSoldItems, price, startPrice, true);
      }
    );

    (async () => {
      const existingValue = getValue(`${card.definitionId}_${dataSource}_price`);
      if (existingValue && existingValue.price) {
        const [isRight, sellPrice] = await getSellPrice(computeSalePrice(existingValue.price), card);
        homeThis._bidNumericStepper.setValue(getSellBidPrice(sellPrice));
        homeThis._buyNowNumericStepper.setValue(sellPrice);
      }
    })();

  };
};
