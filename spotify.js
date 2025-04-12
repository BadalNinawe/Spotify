async function getSongs(file = "music.json") {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const data = await response.json();
    const songArray = [];

    data.albums.forEach((album) => {
      album.songs.forEach((song) => {
        songArray.push({
          title: song.title,
          artist: album.artist,
          duration: song.duration,
          file: song.file,
        });
      });
    });

    return songArray;
  } catch (error) {
    console.error("Error fetching or parsing JSON:", error);
    return [];
  }
}

let currentAudio = null;
let currentIndex = -1;

const playButton = document.querySelector("#play");
const songInfoElement = document.querySelector(".songinfo");
const songTimeElement = document.querySelector(".songtime");

const updateSongInfo = (song) => {
  songInfoElement.innerHTML = `${song.title} - ${song.artist}`;
  songTimeElement.innerHTML = "00:00 / 00:00";
};

const formatTime = (time) => {
  const minutes = Math.floor(time / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

playButton.addEventListener("click", () => {
  if (currentAudio) {
    if (currentAudio.paused) {
      currentAudio.play();
      playButton.src = "./images/pause.svg";
    } else {
      currentAudio.pause();
      playButton.src = "./images/play.svg";
    }
  }
});

const playMusic = (track, index, song) => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(track);
  currentAudio
    .play()
    .then(() => {
      currentIndex = index;
      playButton.src = "./images/pause.svg";
      updateSongInfo(song);

      currentAudio.addEventListener("loadedmetadata", () => {
        songTimeElement.innerHTML = `00:00 / ${formatTime(
          currentAudio.duration
        )}`;
      });

      currentAudio.addEventListener("timeupdate", () => {
        if (currentAudio.duration) {
          songTimeElement.innerHTML = `${formatTime(
            currentAudio.currentTime
          )} / ${formatTime(currentAudio.duration)}`;
          document.querySelector(".circle").style.left =
            (currentAudio.currentTime / currentAudio.duration) * 100 + "%";
        }
      });
    })
    .catch((error) => {
      console.error("Error playing audio:", error);
    });
};

async function main() {
  let songs = await getSongs("music.json");
  const songUL = document.querySelector(".songList ul");

  function renderSongList(songs) {
    songUL.innerHTML = "";
    songs.forEach((song, index) => {
      songUL.innerHTML += `
        <li class="song-item" data-index="${index}">
          <img class="invert" src="./images/music2.svg" alt="music" />
          <div class="info">
            <div><p>${song.title}</p></div>
            <div>${song.artist}</div>
          </div>
          <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="./images/playnow.svg" alt="play now" />
          </div>
        </li>
      `;
    });

    document.querySelectorAll(".playnow").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = e.target.closest(".song-item").getAttribute("data-index");
        playMusic(songs[index].file, index, songs[index]);
      });
    });

    document.querySelectorAll(".song-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (!e.target.closest(".playnow")) {
          const index = item.getAttribute("data-index");
          playMusic(songs[index].file, index, songs[index]);
        }
      });
    });
  }

  renderSongList(songs);

  document.querySelector(".seekbar").addEventListener("click", (e) => {
    if (!currentAudio || !currentAudio.duration) return;
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentAudio.currentTime = (currentAudio.duration * percent) / 100;
  });

  document.querySelector(".humburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-110%";
  });

  document.querySelector("#previous").addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      playMusic(songs[currentIndex].file, currentIndex, songs[currentIndex]);
    } else {
      console.log("This is the first song.");
    }
  });

  document.querySelector("#next").addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
      currentIndex++;
      playMusic(songs[currentIndex].file, currentIndex, songs[currentIndex]);
    } else {
      console.log("This is the last song.");
    }
  });

  document.querySelector(".range input").addEventListener("change", (e) => {
    if (currentAudio) {
      currentAudio.volume = parseFloat(e.target.value) / 100;
    }
  });

  Array.from(document.getElementsByClassName("card")).forEach((card) => {
    card.addEventListener("click", async (e) => {
      const folder = e.currentTarget.dataset.folder;
      if (!folder) return;

      let songs;
      switch (folder) {
        case "ncs":
          songs = await getSongs("ncs.json");
          break;
        case "music":
          songs = await getSongs("music.json");
          break;
        case "hiphop":
          songs = await getSongs("hihop.json");
          break;
        default:
          songs = await getSongs("ncs.json");
      }

      renderSongList(songs);

      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    });
  });
}

main();
