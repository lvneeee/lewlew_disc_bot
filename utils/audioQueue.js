const queues = new Map();       // Map<string, Track[]>
const currentTracks = new Map(); // Map<string, Track>

/**
 * Thêm bài vào hàng đợi của guild
 * @param {string} guildId 
 * @param {object} track - { url, title }
 */
function enqueue(guildId, track) {
  if (!queues.has(guildId)) queues.set(guildId, []);
  queues.get(guildId).push(track);
}

/**
 * Xoá và trả về bài đầu tiên trong queue
 * @param {string} guildId 
 * @returns {object|null}
 */
function dequeue(guildId) {
  if (!queues.has(guildId)) return null;
  return queues.get(guildId).shift() || null;
}

/**
 * Xoá bài đầu tiên khỏi hàng đợi (không trả về)
 * @param {string} guildId
 */
function removeFirst(guildId) {
  if (queues.has(guildId)) {
    const queue = queues.get(guildId);
    if (queue.length > 0) {
      queue.shift();
    }
  }
}

/**
 * Xoá bài bất kỳ trong hàng đợi theo vị trí
 * @param {string} guildId 
 * @param {number} index - vị trí bài trong queue (0 = bài đầu)
 * @returns {boolean} - true nếu xoá thành công
 */
function removeFromQueue(guildId, index) {
  if (!queues.has(guildId)) return false;
  const q = queues.get(guildId);
  if (index < 0 || index >= q.length) return false;
  q.splice(index, 1);
  return true;
}

/**
 * Lấy toàn bộ hàng đợi
 * @param {string} guildId 
 * @returns {Array<object>}
 */
function getQueue(guildId) {
  return queues.get(guildId) || [];
}

/**
 * Đặt bài đang phát
 * @param {string} guildId 
 * @param {object|null} track 
 */
function setCurrentTrack(guildId, track) {
  if (track) {
    currentTracks.set(guildId, track);
  } else {
    currentTracks.delete(guildId);
  }
}

/**
 * Lấy bài đang phát
 * @param {string} guildId 
 * @returns {object|null}
 */
function getCurrentTrack(guildId) {
  return currentTracks.get(guildId) || null;
}

/**
 * Xoá hàng đợi và bài đang phát của guild
 * @param {string} guildId 
 */
function clearQueue(guildId) {
  queues.delete(guildId);
  currentTracks.delete(guildId);
}

module.exports = {
  enqueue,
  dequeue,
  removeFirst,
  removeFromQueue,
  getQueue,
  setCurrentTrack,
  getCurrentTrack,
  clearQueue,
};
