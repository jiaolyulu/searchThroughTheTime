function getDate() {
    let date = new Date();
    let am = 'a';
    let hours = date.getUTCHours() - 7;
    if (hours <= 0) hours += 24;

    if (hours > 12) {
        hours -= 12;
        am = 'p';
    }
    if (hours == 12) am = 'p';
    if (hours == 0) hours = 12;

    let minutes = date.getMinutes().toString();
    if (minutes.length < 2) minutes = `0${minutes}`;

    return `${date.getMonth() + 1}/${date.getDate()}/${date.getYear().toString().slice(1)} ${hours}:${minutes}${am}`;
}

async function createBanner(config, state) {
    let banner = '';
    banner += '// --------------------------------------\n';
    banner += '// \n';
    banner += '//    _  _ _/ .  _  _/ /_ _  _  _        \n';
    banner += '//   /_|/_ / /|//_  / / //_ /_// /_/     \n';
    banner += '//   https://activetheory.net    _/      \n';
    banner += '// \n';
    banner += '// --------------------------------------\n';
    banner += `//   ${getDate()}\n`;
    banner += '// --------------------------------------\n';
    banner += '// goober - https://github.com/cristianbote/goober/blob/master/LICENSE    \n';
    banner += '// theatre.js (@theatre/core) - https://github.com/AriaMinaei/theatre/blob/main/LICENSE    \n';
    banner += '\n';

    state.minifiedCode = banner + state.minifiedCode;
    state.unminifiedCode = banner + state.unminifiedCode;
}

module.exports = createBanner;
