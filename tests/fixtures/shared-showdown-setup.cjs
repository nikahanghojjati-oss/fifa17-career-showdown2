const fs = require("node:fs");
const vm = require("node:vm");

function catalog(){
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync("data/clubs.js", "utf8") + ";globalThis.catalog = clubsByLeague;", context);
  return JSON.parse(JSON.stringify(context.catalog));
}
function authority(role = "playerOne", overrides = {}){
  const one = {slotId:"playerOne", accountId:"synthetic_setup_owner", profileId:`profile_${"a".repeat(24)}`, saveId:`save_${"a".repeat(24)}`, accountState:"active", entitlementState:"active"};
  const two = {slotId:"playerTwo", accountId:"synthetic_setup_peer", profileId:`profile_${"b".repeat(24)}`, saveId:`save_${"b".repeat(24)}`, accountState:"active", entitlementState:"active"};
  const slot = role === "playerOne" ? one : two;
  const rivalryId = `pair_${"c".repeat(64)}`;
  return {rivalryId, connectionState:"active", managerSlots:[one,two], actor:{accountId:slot.accountId, deviceId:`device_${(role === "playerOne" ? "a" : "b").repeat(32)}`, deviceState:"active", managerRole:role, profileId:slot.profileId, saveId:slot.saveId}, session:{sessionId:`session_${"d".repeat(64)}`, rivalryId, state:"active", hostAccountId:one.accountId, memberAccountIds:[one.accountId,two.accountId], expiresAtEpochMs:1_800_000_900_000}, nowEpochMs:1_800_000_000_000, ...overrides};
}
function command(type, baseRevision, sequence, fields = {}){
  return {type, operationId:`setup_op_${sequence.toString(16).padStart(32,"0")}`, baseRevision, ...fields};
}
module.exports = {catalog, authority, command};
