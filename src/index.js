import { MediaPlayer } from "dashjs";

let player;

const corsBridge = "https://cors.bridged.cc/";
const tokenServer = "https://api-stage-tvthek.orf.at/livestream/_token";
const licenseServer = "https://drm.ors.at/acquire-license/widevine";
const brandGuid = "13f2e056-53fe-4469-ba6d-999970dbe549";
const autoplay = true;
const video = document.querySelector("video");
const videoQuality = document.getElementById("video-quality");

async function fetchToken() {
  const response = await fetch(`${corsBridge}${tokenServer}`);
  const data = await response.json();

  return data.base64;
}

function getProtectionData(token) {
  return {
    "com.widevine.alpha": {
      serverURL: `${licenseServer}?brandGuid=${encodeURIComponent(brandGuid)}&userToken=${token}`,
      videoRobustness: "SW_SECURE_CRYPTO",
      audioRobustness: "SW_SECURE_CRYPTO",
    },
  };
}

async function onStreamStart(event) {
  const stream = event.target.dataset.stream;
  const token = await fetchToken();

  if (player) player.reset();

  player = MediaPlayer().create();
  player.setProtectionData(getProtectionData(token));
  player.initialize(video, stream, autoplay);

  player.on(MediaPlayer.events.STREAM_INITIALIZED, () => {
    const videoQualities = player.getBitrateInfoListFor("video");
    const markup = videoQualities.map((quality) => {
      return `<option value="${quality.qualityIndex}">${quality.height}p (${Math.round(quality.bitrate / 1000)} kbit/s)</option>`;
    });
    videoQuality.innerHTML = `<option value="auto">Auto</option>${markup.join("")}`;
  });
}

function init() {
  const programButtons = document.querySelectorAll("nav button");
  const stopButton = document.getElementById("stop");

  stopButton.addEventListener("click", () => {
    if (player) player.reset();
  });

  videoQuality.addEventListener("change", (event) => {
    if (player) {
      const config = {
        streaming: {
          abr: {
            autoSwitchBitrate: {},
          },
        },
      };

      if (event.target.value === "auto") {
        config.streaming.abr.autoSwitchBitrate["video"] = true;
        player.updateSettings(config);
      } else {
        config.streaming.abr.autoSwitchBitrate["video"] = false;
        player.updateSettings(config);
        player.setQualityFor("video", parseInt(event.target.value, 10));
      }
    }
  });

  for (let button of programButtons) {
    button.addEventListener("click", onStreamStart);
  }
}

init();
