/* Cover-art colour theming for the feed detail page.
 * Samples the dominant hue from the cover image and injects
 * matching accent colours as a dynamic <style> block.
 */
(function () {
  var coverImg = document.querySelector('img.cover');
  if (!coverImg) return;

  function rgbToHsl(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2, h = 0, s = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else                h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s, l];
  }

  function extractHue(img) {
    try {
      var c = document.createElement('canvas');
      c.width = c.height = 64;
      var ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 64, 64);
      var d = ctx.getImageData(0, 0, 64, 64).data;
      var buckets = new Float32Array(36);
      for (var i = 0; i < d.length; i += 4) {
        var hsl = rgbToHsl(d[i] / 255, d[i+1] / 255, d[i+2] / 255);
        var s = hsl[1], l = hsl[2];
        if (s < 0.18 || l < 0.07 || l > 0.93) continue;
        buckets[Math.floor(hsl[0] / 10) % 36] += s * (1 - Math.abs(l - 0.5) * 1.4);
      }
      // Smooth across neighbouring buckets to avoid straddling two
      var sm = new Float32Array(36);
      for (var j = 0; j < 36; j++)
        sm[j] = buckets[(j + 35) % 36] * 0.3 + buckets[j] + buckets[(j + 1) % 36] * 0.3;
      var best = 0;
      for (var j = 1; j < 36; j++) if (sm[j] > sm[best]) best = j;
      return sm[best] > 0.5 ? best * 10 + 5 : null;
    } catch (e) { return null; }
  }

  function applyHue(hue) {
    var h2 = (hue + 40) % 360;
    var light = window.matchMedia('(prefers-color-scheme: light)').matches;

    var css = ':root{'
      + '--accent:hsl('  + hue + ',70%,55%);'
      + '--accent2:hsl(' + h2  + ',65%,52%)'
      + '}';

    if (!light) {
      css += ':root{'
        + '--bg:hsl('  + hue + ',35%,6%);'
        + '--bg2:hsl(' + hue + ',30%,9%)'
        + '}';
      css += 'body{'
        + 'background:'
        +   'radial-gradient(1200px 500px at 10% 0%,hsla(' + hue + ',70%,45%,.38),transparent 60%),'
        +   'radial-gradient(900px 500px at 90% 10%,hsla(' + h2  + ',65%,45%,.26),transparent 55%),'
        +   'linear-gradient(180deg,hsl(' + hue + ',35%,6%),hsl(' + hue + ',30%,9%));'
        + 'background-attachment:fixed'
        + '}';
      css += '#player-bar{background:hsla(' + hue + ',40%,7%,.95)}';
    }

    // Gradient buttons
    css += '.btn.primary{'
      + 'border-color:hsla(' + hue + ',70%,55%,.55);'
      + 'background:linear-gradient(135deg,hsla(' + hue + ',70%,50%,.92),hsla(' + h2 + ',65%,48%,.72))'
      + '}';
    css += '.btn.primary:hover{'
      + 'background:linear-gradient(135deg,hsl(' + hue + ',70%,50%),hsla(' + h2 + ',65%,48%,.85))'
      + '}';

    // Row play buttons
    css += '.ep-play:hover{'
      + 'background:hsla(' + hue + ',70%,50%,.3);'
      + 'border-color:hsla(' + hue + ',70%,50%,.5)'
      + '}';
    css += '.ep-play.playing{background:hsla(' + hue + ',70%,50%,.85)}';

    // Sticky player
    css += '.player-btn{'
      + 'background:linear-gradient(135deg,hsla(' + hue + ',70%,50%,.9),hsla(' + h2 + ',65%,48%,.7))'
      + '}';
    css += '.player-seek{'
      + 'background:linear-gradient(to right,'
      +   'hsl(' + hue + ',70%,55%) var(--prog,0%),'
      +   'rgba(255,255,255,.18) var(--prog,0%))'
      + '}';
    css += '.player-auto-btn.on{'
      + 'background:hsla(' + hue + ',70%,50%,.25);'
      + 'border-color:hsla(' + hue + ',70%,55%,.5);'
      + 'color:hsl(' + hue + ',80%,72%)'
      + '}';

    // Badges
    css += '.type-badge.podcast,.type-badge.book{'
      + 'background:hsla(' + hue + ',70%,55%,.2);'
      + 'color:hsl(' + hue + ',80%,74%);'
      + 'border-color:hsla(' + hue + ',70%,55%,.34)'
      + '}';
    css += '.fmt-badge{'
      + 'background:hsla(' + hue + ',70%,55%,.18);'
      + 'color:hsl(' + hue + ',80%,72%);'
      + 'border-color:hsla(' + hue + ',70%,55%,.28)'
      + '}';

    // Description links / blockquotes
    css += '.desc-body a{color:hsl(' + hue + ',80%,72%)}';
    css += '.desc-body blockquote{border-left-color:hsl(' + hue + ',70%,55%);background:hsla(' + hue + ',70%,50%,.08)}';

    var el = document.createElement('style');
    el.id = 'cover-theme';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function run() {
    var hue = extractHue(coverImg);
    if (hue !== null) applyHue(hue);
  }

  if (coverImg.complete && coverImg.naturalWidth > 0) run();
  else coverImg.addEventListener('load', run);
}());
