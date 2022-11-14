import { getNonActiveSquadPlayers, listAllBronzeWithOverPrice } from "../services/club";
import { t } from "../services/translate";
import { hideLoader, showLoader } from "../utils/commonUtil";
import { sendUINotification } from "../utils/notificationUtil";
import {
  moveToTransferList,
  showMoveToTransferListPopup,
} from "../utils/transferListUtil";
import {
  generateListForFutBinForAllBronzeOverPriceBtn,
  generateDownloadClubCsv,
  generateSendToTransferList,
} from "../utils/uiUtils/generateElements";

export const clubSearchOverride = () => {
  const clubPageGenerate = UTClubItemSearchHeaderView.prototype._generate;

  const sendClubPlayersToTradePile = async function () {
    if (repositories.Item.isPileFull(ItemPile.TRANSFER)) {
      return sendUINotification(
        t("transferListFull"),
        UINotificationType.NEGATIVE
      );
    }
    showLoader();
    let nonActiveSquadPlayers = await getNonActiveSquadPlayers(true);
    if (nonActiveSquadPlayers) {
      moveToTransferList(nonActiveSquadPlayers);
    }
    hideLoader();
  };

  UTClubItemSearchHeaderView.prototype._generate = function (...args) {
    if (!this._generated) {
      clubPageGenerate.call(this, ...args);
      const listBronzeBtn = generateListForFutBinForAllBronzeOverPriceBtn();
      const downloadClubBtn = generateDownloadClubCsv();
      const sendToTransferList = generateSendToTransferList(
        () => showMoveToTransferListPopup(sendClubPlayersToTradePile),
        "clubAction"
      );
      this.__searchContainer.prepend(listBronzeBtn.__root);
      this.__searchContainer.prepend(downloadClubBtn.__root);
      this.__searchContainer.prepend(sendToTransferList.__root);
    }
  };
};
