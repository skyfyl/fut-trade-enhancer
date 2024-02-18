import { sendRequest } from "../../utils/networkUtil";
import { getValue, setValue } from "../repository";
import { getUserPlatform } from "../user";
import { getSquadPlayerIds, getSquadPlayerLookup } from "../club";
import {
  getLatestAllSBCSForChallenge,
  getAllSBCSForChallenge,
  getSbcPlayersInfo,
} from "../datasource/futbin";
import { hideLoader, showLoader } from "../../utils/commonUtil";

const fetchPrices = async (items) => {
  const result = new Map();

  const missingIds = new Set();

  for (const item of items) {
    if (!item.definitionId) {
      continue;
    }

    const priceDetail = getValue(`${item.definitionId}_in-house_price`);
    if (priceDetail) {
      result.set(`${item.definitionId}_in-house_price`, priceDetail.price);
    } else {
      missingIds.add(item.definitionId);
    }
  }

  const pendingPromises = [];

  if (missingIds.size) {
    pendingPromises.push(fetchPricesFromServer(missingIds, result));
  }

  await Promise.all(pendingPromises);

  return result;
};

export const fetchSolvableSbcs = async (payload) => {
  const response = await sendRequest(
    atob(
      "aHR0cHM6Ly9sa3kzM2ljeDRsZ29tMzN2cG9vdWZ1ZXZmYTBzcWlhcS5sYW1iZGEtdXJsLmV1LXdlc3QtMS5vbi5hd3M="
    ),
    "POST",
    `${Math.floor(+new Date())}_fetchSolvableSbcs`,
    {
      playerIds: payload,
    }
  );
  return JSON.parse(response);
};

export const fetchSbcs = async (challengeId, payload) => {
  const response = await sendRequest(
    `${atob(
      "aHR0cHM6Ly9hZWlkeDcycXUzMzVqdzdtYmFjeTJwMnd2aTB0Z2lwZi5sYW1iZGEtdXJsLmV1LXdlc3QtMS5vbi5hd3M/c2JjSWQ9"
    )}${challengeId}`,
    "POST",
    `${Math.floor(+new Date())}_sbcSolution_${challengeId}`,
    {
      playerIds: payload,
    }
  );
  return JSON.parse(response);
};

const getSBCSChallenge = async (challengeId) => {
    try {
      const cacheKey = `${challengeId}_futbin_challenge`;
      const value = getValue(cacheKey);
      if (value) {
        return value.squads;
      } else{
        const squads = await getLatestAllSBCSForChallenge(challengeId);      
        const cacheValue = {
          expiryTimeStamp: new Date(Date.now() + 15 * 60 * 1000),
          squads: squads
        };
  
        setValue(cacheKey, cacheValue);
        return squads;
      }      
    } catch (err) {
      console.log(err);
    }
};

const getSBCSChallengeSquad = async (challengeId, squadId) => {
  try {
    const cacheKey = `${challengeId}_futbin_challenge_${squadId}`;
    const value = getValue(cacheKey);
    if (value) {
      return value.squad;
    } else{
      const squad = await getSbcPlayersInfo(squadId);  
      const cacheValue = {
        expiryTimeStamp: new Date(Date.now() + 2 * 60 * 60 * 1000),
        squad: squad
      };

      setValue(cacheKey, cacheValue);
      return squad;
    }      
  } catch (err) {
    console.log(err);
  }
};

export const fetchSbcsWithLocal = async (challengeId, squadPlayers) => {
  const sbcId = challengeId;
  const sbcs = [];
  // const squadPlayers = await getSquadPlayerIds();
  console.time('Squaring elements 2.1');
  const squads = await getSBCSChallenge(challengeId);
  console.timeEnd('Squaring elements 2.1');

  console.time('Squaring elements 2.2');
  for (let index = 0; index < squads.length; index++) {
    const squad = squads[index];
    const _id = squad.id;
    console.time('Squaring elements 2.2.1');
    const futBinSquadPlayersInfo = await getSBCSChallengeSquad(challengeId, squad.id);
    console.timeEnd('Squaring elements 2.2.1');
    let availablePlayers = 0;
    const players = [];
    console.time('Squaring elements 2.2.2');
    for (let i = 0; i < futBinSquadPlayersInfo.length; i++) {
      const playersInfo = futBinSquadPlayersInfo[i];
      if (playersInfo) {
        players.push(playersInfo.definitionId); 
        if (squadPlayers.indexOf(playersInfo.definitionId) !== -1){
          availablePlayers +=1;      
        }      
      }
    } 
    console.timeEnd('Squaring elements 2.2.2');
    
    sbcs.push({
      _id,
      availablePlayers,
      players,
      sbcId
    });
    
  }
  console.timeEnd('Squaring elements 2.2');
  return sbcs;
};

export const fetchUniqueSbc = async (challengeId) => {
  const response = await sendRequest(
    `${atob(
      "aHR0cHM6Ly9rZWV5bGRmdWxmaHQ1NjNoZ3N3ZHJxamlnZTBudnR2ZS5sYW1iZGEtdXJsLmV1LXdlc3QtMS5vbi5hd3M/c2JjSWQ9"
    )}${challengeId}`,
    "GET",
    `${Math.floor(+new Date())}_fetchUniqueSbc_${challengeId}`
  );
  return JSON.parse(response);
};

const fetchPricesFromServer = async (defIds, result) => {
  const idsArray = Array.from(defIds);
  const platform = getUserPlatform();
  while (idsArray.length) {
    try {
      const defIds = idsArray.splice(0, 30);
      const url = `https://api.futhelpers.com/auction?platform=${platform}&defIds=${defIds.join(
        ","
      )}`;
      const response = await fetch(url, {
        headers: {
          Accept: "'application/json'",
          "Content-Type": "'application/json'",
        },
        method: "GET",
      });

      const priceResponse = await response.json();

      for (const id of [...defIds]) {
        if (!priceResponse[id] || !priceResponse[id][platform]) {
          continue;
        }
        const prices = priceResponse[id][platform].prices;
        const cardPrice = prices ? prices[0].price : 0;
        if (!cardPrice) {
          continue;
        }

        const cacheKey = `${id}_in-house_price`;
        const cacheValue = {
          expiryTimeStamp: new Date(Date.now() + 15 * 60 * 1000),
          price: cardPrice,
        };

        setValue(cacheKey, cacheValue);
        result.set(cacheKey, cardPrice);
      }
    } catch (err) {
      console.log(err);
    }
  }
};
export default {
  fetchPrices,
};
