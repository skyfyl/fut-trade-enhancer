import { getDataSource, getValue,setValue } from "../repository";
import futwiz from "./futwiz";
import futbin from "./futbin";
import marketAlert from "./marketAlert";
import { calculatePlayerMinBin } from "./../minBinCalc";

export const getPlayerUrl = (player) => {
  const dataSource = getDataSource();

  if (dataSource === "futwiz") {
    return futwiz.getPlayerUrl(player);
  } else {
    return futbin.getPlayerUrl(player);
  }
};

export const fetchPrices = async (items) => {
  const dataSource = getDataSource();

  if (dataSource === "futwiz") {
    return futwiz.fetchPrices(items);
  } else if (dataSource === "futbin") {
    return futbin.fetchPrices(items);
  } else {
    return marketAlert.fetchPrices(items);
  }
};

export const fetchNoPlayerPrices = async (items) => {
  const result = new Map();

  const missingConsumables = new Map();

  for (const item of items) {
    if (!item.definitionId) {
      continue;
    }

    const priceDetail = getValue(`${item.definitionId}_futbin_price`);
    if (priceDetail) {
      result.set(`${item.definitionId}_futbin_price`, priceDetail.price);
    } else  {
      if (!missingConsumables.has(item._staticData.name)) {
        missingConsumables.set(item._staticData.name, []);
      }
      missingConsumables.get(item._staticData.name).push({
        definitionId: item.definitionId,
        subType: item,
      });
    }
  }

  const pendingPromises = [];

  if (missingConsumables.size) {
    pendingPromises.push(fetchConsumablesPricesWithMinBin(missingConsumables, result));
  }
  await Promise.all(pendingPromises);

  return result;
};

const fetchConsumablesPricesWithMinBin = async (missingConsumables, result) => {
  const consumableTypes = Array.from(missingConsumables.keys());
  for (const consumableType of consumableTypes) {
    try {
      const consumableCards = missingConsumables.get(consumableType) || [];
      for (const { definitionId, subType } of consumableCards) {
        const playerMin = await calculatePlayerMinBin(subType);;
        const cacheKey = `${definitionId}_futbin_price`;
        if (playerMin.min) {
          const cacheValue = {
            expiryTimeStamp: new Date(Date.now() + 15 * 60 * 1000),
            price: playerMin.min,
          };
          setValue(cacheKey, cacheValue);
          result.set(cacheKey, playerMin.min);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
};
