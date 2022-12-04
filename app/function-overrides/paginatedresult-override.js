import { appendCardPrice, appendSectionPrices } from "../utils/priceAppendUtil";
import {
  getCheckedSection,
  getSelectedPlayersBySection,
  clearSelectedPlayersBySection,
} from "../services/repository";

export const paginatedResultOverride = () => {
  const paginatedRenderList = UTPaginatedItemListView.prototype._renderItems;
  const setSectionHeader = UTSectionedItemListView.prototype.setHeader;

  const relistSupportedSections = new Set();

  UTPaginatedItemListView.prototype._renderItems = function (...args) {
    const result = paginatedRenderList.call(this, args);
    const section = "club";
    clearSelectedPlayersBySection(section + "_data");
    const selectedPlayersBySectionData = getSelectedPlayersBySection(section + "_data") || new Map();
    for (const { data } of this.listRows) {
      selectedPlayersBySectionData.set(data.id, data);
    }            

    appendSectionPrices({
      listRows: this.listRows.map(({ __root, __auction, data }) => ({
        __root,
        __auction,
        data,
      })),
      headerElement: $(this.__root),
      isRelistSupported: true,
      sectionHeader: section,
    });
    appendCardPrice(
      this.listRows.map(({ __root, __auction, data }) => ({
        __root,
        __auction,
        data,
      })),
      section
    );
    return result;
  };

  UTSectionedItemListView.prototype.setHeader = function (
    section,
    text,
    ...args
  ) {
    const result = setSectionHeader.call(this, section, text, ...args);
    if (!relistSupportedSections.size) {
      populateRelistSupportedSection();
    }
    appendSectionPrices({
      listRows: this.listRows.map(({ __root, __auction, data }) => ({
        __root,
        __auction,
        data,
      })),
      headerElement: $(this._header.__root),
      isRelistSupported: relistSupportedSections.has(text),
      sectionHeader: text,
    });
    return result;
  };

  const populateRelistSupportedSection = () => {
    [
      services.Localization.localize("infopanel.label.addplayer"),
      services.Localization.localize("tradepile.button.relistall"),
      services.Localization.localize("infopanel.label.alltoclub"),
      services.Localization.localize("infopanel.label.storeAllInClub"),
    ].forEach((section) => relistSupportedSections.add(section));
  };
};
