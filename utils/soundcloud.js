const scdl = require('soundcloud-downloader').default;

async function getSoundCloudTrackInfo(url, clientId) {
  try {
    const info = await scdl.getInfo(url, clientId);
    if (!info) return null;
    return {
      title: info.title,
      author: info.user.username,
      url: url
    };
  } catch (err) {
    return null;
  }
}

async function getSoundCloudStream(url, clientId) {
  try {
    return await scdl.download(url, clientId);
  } catch (err) {
    return null;
  }
}

module.exports = { getSoundCloudTrackInfo, getSoundCloudStream };
