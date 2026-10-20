// The isolated page that draws one frame of the series video, full screen
// (EthniAfrica Cartes 1.4.0; map cards on satellite imagery since 1.4.1,
// with the satellite video's own shader and overlays). Its geometry and
// styles follow the design
// board handoff/video-board-full.html; the cards' words, inks and fonts come
// from the design system itself (EthniCards.render with context 'video'), so
// they match the carousel. The image fills the frame and only text sits on
// it: every letter carries its own dark outline, and since 1.9.0 a second,
// wider contour that follows the letters; nothing darkens the image.
// Everything arrives from series-render.mjs; the page has no clock and no
// network.
import { FLAT_VERT, FLAT_FRAG, OVERLAY_SCRIPT } from "./page.mjs";
import { flatProject, areaStyle, MARKS } from "./series-map.mjs";
import { documentFrame } from "./series-document.mjs";

export const SERIES_PAGE_HTML = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="/design/components/bundle.css">
<!-- 1.12.0: the parchment card's ground is the idents', with the site's colour
     tokens it is built from; the design's own tokens, installed after, keep
     their names. -->
<link rel="stylesheet" href="/repo/src/styles/tokens/color.css">
<link rel="stylesheet" href="/repo/social/series-idents/ground.css">
<script src="/design/components/bundle.js"></script>
<style>
/* As in the 0.4.0 page: Nunito Sans draws ʾ and ʿ in the middle of half an
   em; Noto Sans sets them against their letter. */
@font-face{font-family:"Nunito Sans";src:url(/design/fonts/NotoSans-Variable.ttf);font-weight:200 1000;unicode-range:U+02BE-02BF}
@font-face{font-family:"Noto Sans Arabic";src:url(/design/fonts/NotoSansArabic-SemiBold.ttf);font-weight:600}
html,body{margin:0;background:#000}
/* On-image inks: the tokens on-image-*, the same in Nuit and Parchemin
   (operator, 14 October 2026). */
#frame{position:relative;width:1080px;height:1920px;overflow:hidden;background:#0b0806;
  --oi-ink:var(--on-image-ink);--oi-text:var(--on-image-text);--oi-muted:var(--on-image-muted);--oi-faint:var(--on-image-faint);
  --oi-accent:var(--on-image-accent);--oi-on-accent:var(--on-image-on-accent);--oi-stroke:var(--on-image-stroke)}
.vf-layer{position:absolute;inset:0;display:none}
.vf-pic{position:absolute;inset:0;overflow:hidden}
.vf-pic img{position:absolute;max-width:none;display:block}
.vf-ident{position:absolute;left:0;top:0;width:1080px;height:1920px;border:0;display:block}
/* 1.4.1: a map card on imagery, its overlays and names; all of it zooms. */
.vf-map{position:absolute;left:0;top:0;width:1080px;height:1920px}
.vf-map canvas,.vf-map svg{position:absolute;left:0;top:0;width:1080px;height:1920px;display:block}
.sm-name{position:absolute;white-space:nowrap;transform:translate(-50%,-50%);text-shadow:0 0 2px rgba(11,8,6,.95),0 0 8px rgba(11,8,6,.8),0 1px 14px rgba(11,8,6,.6)}
.sm-region{font-family:var(--font-display);font-weight:400;letter-spacing:.12em;text-indent:.12em;color:rgba(243,233,218,.94)}
.sm-area{font-family:var(--font-text);font-weight:700}
.sm-water{font:italic 700 26px/30px var(--font-text);color:#bfe0ea}
/* 1.5.0: a map sequence's name in its ink over the head's dark outline, its
   language in italic under it, in one box kept at full height. */
.sm-seq{display:flex;flex-direction:column;align-items:center;text-align:center}
.sm-self{font:700 32px/38px var(--font-text);-webkit-text-stroke:6px var(--oi-stroke);paint-order:stroke fill}
.sm-lang{font:italic 700 26px/30px var(--font-text);-webkit-text-stroke:5px var(--oi-stroke);paint-order:stroke fill}
.sm-place{position:absolute;left:0;top:0}
.sm-dot{position:absolute;width:16px;height:16px;box-sizing:border-box;border-radius:999px;background:#f3e9da;border:3px solid rgba(11,8,6,.7)}
.sm-place-name{position:absolute;font:800 28px/32px var(--font-text);color:#f3e9da;white-space:nowrap;text-shadow:0 0 2px rgba(11,8,6,.95),0 0 6px rgba(11,8,6,.8),0 1px 10px rgba(11,8,6,.6)}
/* 1.11.0: words on the map (series.md, « 6 »), each with its outline and
   its 1.9.0 second contour; the drawings' labels; the drawings. */
.sm-wd{position:absolute;white-space:nowrap;transform:translate(-50%,-50%);text-align:center}
.oi.sm-wd-phrase,.oi.sm-wd-name{font:800 40px/48px var(--font-text);color:var(--oi-text);--sw:6px}
.oi.sm-wd-date{font:400 80px/80px var(--font-display);letter-spacing:.01em;color:var(--oi-text);--sw:9px}
.oi.sm-wd-country{font:400 64px/70px var(--font-display);letter-spacing:.1em;text-indent:.1em;color:var(--oi-text);--sw:8px}
.oi.sm-wd-dates{font:800 30px/36px var(--font-text);color:var(--oi-muted);--sw:4px}
.oi.sm-lab{position:absolute;white-space:nowrap;transform:translate(-50%,0);font:800 28px/32px var(--font-text);color:var(--oi-ink);--sw:4px}
.sm-ill{position:absolute;display:block;max-width:none}
.vf-keys{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px;margin-bottom:6px}
.vf-keys .vf-key{font-size:24px;line-height:30px;margin-bottom:6px}
.vf-key svg{width:36px;height:24px;flex:none;display:block}
.vf-slot{position:absolute;inset:0;background:repeating-linear-gradient(135deg,var(--ground) 0 18px,var(--slot-stripe) 18px 22px)}
#frame[data-theme="nuit"] .vf-slot{--slot-stripe:#2a2118}
#frame[data-theme="parchemin"] .vf-slot{--slot-stripe:#ebe1d0}
.vf-slot:before{content:'';position:absolute;left:48px;top:48px;right:48px;bottom:48px;border:2px solid var(--rule)}
.vf-slot-text{position:absolute;left:120px;width:840px;top:760px;height:480px;display:flex;flex-direction:column;justify-content:center;gap:14px}
.vf-slot-label{font:800 30px/36px var(--font-text);letter-spacing:.1em;text-transform:uppercase;color:var(--oi-accent);--sw:4px}
.vf-slot-find{font:700 40px/52px var(--font-text);--sw:6px;text-wrap:pretty}
.vf-slot-label.oi{color:var(--oi-accent)}
/* The one text treatment: light letters on a dark outline painted under them.
   1.9.0: the second contour and its soft shadow come from the ring filters
   (ringFilters), set on each outermost block; the 1.4.0 soft shadow
   (on-image-shadow) is retired from the text on the image. */
.oi{--area-a-ink:var(--on-image-accent);--area-b-ink:var(--area-b-ink-on-image,#6cc3b5);--area-c-ink:var(--area-c-ink-on-image,#e3876a);
  color:var(--oi-ink);paint-order:stroke fill;-webkit-text-stroke:var(--sw,4px) var(--oi-stroke)}
.oi .ec-accent,.oi em{color:var(--oi-accent);font-style:normal}
.vf-band{position:absolute;left:60px;top:250px;font:800 32px/40px var(--font-text);letter-spacing:.02em;--sw:4px;white-space:nowrap;z-index:3}
.vf-band .vf-sep{color:var(--oi-faint)} .vf-band .vf-ep{color:var(--oi-accent)}
.vf-head{position:absolute;left:60px;width:960px;top:318px;display:flex;flex-direction:column}
/* 1.10.0: the kicker at 36/42 in the accent ink, 4 px above the title, so the
   head keeps its height. */
.vf-kick{font:800 36px/42px var(--font-text);letter-spacing:.02em;color:var(--oi-accent);--sw:5px;margin-bottom:4px}
.vf-title{font:400 88px/90px var(--font-display);letter-spacing:.005em;margin:0;text-wrap:balance;--sw:10px}
.vf-title--xl{font-size:116px;line-height:112px;--sw:13px}
.vf-date{font:400 176px/156px var(--font-display);letter-spacing:.01em;color:var(--oi-accent);margin:0;--sw:14px;white-space:nowrap}
.vf-label{font:800 22px/28px var(--font-text);letter-spacing:.1em;text-transform:uppercase;color:var(--oi-muted);--sw:4px;margin-top:14px}
.vf-name{font:400 76px/82px var(--font-display);--sw:8px;margin-top:2px}
.vf-close{position:absolute;left:60px;width:960px;top:318px;text-align:center;display:flex;flex-direction:column;align-items:center}
.vf-sigline{font:600 56px/64px var(--font-wordmark);color:var(--oi-ink);--sw:8px}
.vf-sigline span{display:block;white-space:nowrap}
.vf-sent{font:700 32px/40px var(--font-text);--sw:4px;margin-top:28px;max-width:900px;text-wrap:balance}
.vf-sent p{margin:0}
/* 1.10.0: the fixed invitation, two lines set without wrapping. */
.vf-sent span{display:block;white-space:nowrap}
/* 1.7.0: the long series video (series.md, « Vidéo longue et chapitres »). */
/* The chapter card (operator, 20 October 2026; board « Carte de chapitre
   animée »): text on the dark ground, a slow golden glow, a line and one dot
   per chapter, « n sur N », then the centred title. Nothing else. */
.vf-chapground{position:absolute;inset:0;background:var(--ground);overflow:hidden}
.vf-chapglow{position:absolute;width:1400px;height:1400px;left:-160px;top:260px;border-radius:50%;background:radial-gradient(closest-side,rgba(232,185,106,.16),rgba(232,185,106,0))}
.vf-chap{position:absolute;inset:0}
.vf-chaptrack{position:absolute;left:0;right:0;top:770px;display:flex;justify-content:center}
.vf-chapdots{position:relative;display:flex;gap:84px;align-items:center}
.vf-chapline{position:absolute;left:12px;right:12px;top:50%;height:4px;margin-top:-2px;background:var(--rule);transform-origin:left center}
.vf-chapdot{position:relative;width:24px;height:24px;box-sizing:border-box;border-radius:50%;border:4px solid var(--oi-faint);background:var(--ground)}
.vf-chapdot.done{background:var(--oi-faint)}
.vf-chapdot.now{border-color:var(--oi-accent);background:var(--oi-accent)}
.vf-chapring{position:absolute;inset:-18px;border-radius:50%;border:4px solid var(--oi-accent);opacity:0}
.vf-chapcount{position:absolute;left:0;right:0;top:850px;text-align:center;font:800 44px/52px var(--font-text);color:var(--oi-muted)}
.vf-chapcount b{color:var(--oi-accent);font-weight:800}
.vf-chaptitle{position:absolute;left:90px;right:90px;top:986px;margin:0;text-align:center;font:400 112px/112px var(--font-display);color:var(--oi-text);text-wrap:balance}
.vf-list{width:960px;display:flex;flex-direction:column;margin-top:30px}
.vf-row+.vf-row{margin-top:22px}
.vf-rlab{font:800 26px/32px var(--font-text);letter-spacing:.02em;color:var(--oi-accent);--sw:4px}
.vf-txt{font:800 40px/48px var(--font-text);color:var(--oi-text);--sw:6px;text-wrap:balance}
.vf-by{font:700 26px/32px var(--font-text);color:var(--oi-muted);--sw:4px}
.vf-figs{width:960px;display:grid;grid-template-columns:1fr 1fr;gap:34px 40px;margin-top:34px}
.vf-val{font:400 112px/104px var(--font-display);color:var(--oi-ink);--sw:12px;white-space:nowrap}
.vf-val small{font:400 52px/52px var(--font-display);--sw:7px;margin-left:10px}
.vf-val i{font:800 30px/36px var(--font-text);font-style:normal;color:var(--oi-muted);--sw:4px;display:block;margin-bottom:4px}
.vf-flab{font:700 30px/38px var(--font-text);color:var(--oi-ink);--sw:4px;margin-top:8px;text-wrap:balance}
.vf-attr{position:absolute;left:60px;width:900px;bottom:624px;display:flex;flex-direction:column}
.vf-nm{font:800 34px/40px var(--font-text);color:var(--oi-text);--sw:5px}
.vf-rl{font:700 26px/32px var(--font-text);color:var(--oi-muted);--sw:4px}
.vf-next{margin-top:30px;font:700 32px/40px var(--font-text);--sw:4px;color:var(--oi-ink);white-space:nowrap}
.vf-next em{color:var(--oi-accent);font-weight:800}
.vf-nowrap{white-space:nowrap}
/* 1.8.0: the document card and the teaching cards (series.md, « Document and
   teaching cards »), sizes and inks as the accepted board draws them. */
.vf-doc{position:absolute;overflow:hidden}
.vf-mark{position:absolute;height:7px;background:var(--oi-accent);box-shadow:0 0 0 2px rgba(11,8,6,.85);border-radius:2px}
.vf-probe{position:absolute;left:0;width:100%;pointer-events:none}
.vf-fx{position:absolute;left:60px;width:960px;top:740px}
.vf-fx-step{position:absolute;left:0;top:0;width:960px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.vf-fx .fx-dayline{font:800 40px/48px var(--font-text);--sw:5px}
.vf-fx .fx-lab{font:800 32px/38px var(--font-text);--sw:5px;margin-top:10px}
.vf-fx .fx-eq{font:400 120px/124px var(--font-display);--sw:12px;white-space:nowrap}
.vf-fx .fx-op{font:800 64px/64px var(--font-text);color:var(--oi-muted);--sw:7px;margin:0 22px;position:relative;top:-14px}
.vf-fx .fx-r,.vf-fx .fx-p-day{color:var(--oi-accent)}
.vf-fx .fx-p-dropped{opacity:.3}
.vf-fx .fx-note{font:700 26px/32px var(--font-text);color:var(--oi-muted);--sw:4px;margin-top:8px;max-width:900px}
.vf-sbs{width:960px;display:grid;grid-template-columns:1fr 1fr;gap:16px 40px;margin-top:34px}
.vf-sbs .sbs-hd{font:800 28px/34px var(--font-text);color:var(--oi-accent);--sw:4px}
.vf-sbs .sbs-nm{font:400 72px/74px var(--font-display);--sw:9px;white-space:nowrap}
.vf-sbs .sbs-dy{font:800 36px/42px var(--font-text);color:var(--oi-accent);--sw:5px;min-height:42px}
.vf-sbs .sbs-note{grid-column:1 / span 2;font:700 28px/36px var(--font-text);color:var(--oi-muted);--sw:4px;margin-top:10px}
.vf-week{width:960px;display:grid;grid-template-columns:150px 1fr 1fr;gap:10px 24px;margin-top:30px;align-items:baseline}
.vf-week .wk-hd{font:800 28px/34px var(--font-text);color:var(--oi-accent);--sw:4px}
.vf-week .wk-sub{font:700 22px/28px var(--font-text);color:var(--oi-muted);--sw:4px;margin-top:-6px}
.vf-week .wk-dn{font:800 30px/36px var(--font-text);color:var(--oi-muted);--sw:4px}
.vf-week .wk-nm{font:800 38px/44px var(--font-text);color:var(--oi-text);--sw:5px;white-space:nowrap}
.vf-week .wk-dw{font:700 24px/28px var(--font-text);color:var(--oi-muted);--sw:4px;display:block}
/* 1.12.0: the parchment card (series.md, « Teaching cards in motion and the
   parchment card »): the idents' ground, its texts in the Cartes Parchemin
   inks without outline or second contour. */
.vf-ground{position:absolute;inset:0;overflow:hidden;background:var(--afh-color-bg)}
.vf-pa{--oi-ink:var(--ink);--oi-text:var(--ink);--oi-muted:var(--ink-muted);--oi-faint:var(--ink-faint);--oi-accent:var(--accent)}
.vf-pa .oi,.vf-pa.oi{-webkit-text-stroke-width:0!important;filter:none!important}
.vf-pa .vf-sign img{filter:none}
.pa-abs{position:absolute;left:0;top:0;width:1080px;height:1920px;pointer-events:none}
.pa-abs>*{position:absolute}
.pw-people{left:60px;width:960px;top:490px;text-align:center;font:800 40px/48px var(--font-text);color:var(--oi-accent)}
.pw-people span{font:700 30px/48px var(--font-text);color:var(--oi-muted)}
.pw-lab{top:550px;font:800 22px/28px var(--font-text);letter-spacing:.12em;text-transform:uppercase;color:var(--oi-muted);white-space:nowrap}
.pw-row{left:0;width:1080px;height:96px}
.pw-row>*{position:absolute;white-space:nowrap}
.pw-band{left:60px;width:960px;top:4px;height:88px;box-sizing:border-box;border-radius:14px;background:var(--row-highlight);border:2px solid color-mix(in srgb,var(--accent) 35%,transparent)}
.pw-name{top:20px;font:800 48px/56px var(--font-text);color:var(--oi-ink)}
.pw-girl{right:680px;text-align:right}
.pw-boy{left:680px}
.pw-day{left:400px;width:280px;top:13px;text-align:center}
.pw-dn{font:800 32px/38px var(--font-text);color:var(--oi-ink)}
.pw-dw{font:italic 700 28px/32px var(--font-text);color:var(--oi-accent)}
.pw-rule{left:74px;width:932px;top:95px;height:1px;background:var(--rule)}
.pf-day{left:60px;width:960px;top:590px;text-align:center;font:800 44px/52px var(--font-text);color:var(--oi-ink)}
.pf-r,.pf-day-part{color:var(--oi-accent)}
.pf-lab{left:60px;width:960px;text-align:center;font:800 26px/32px var(--font-text);letter-spacing:.12em;text-transform:uppercase;color:var(--oi-muted)}
.pf-piece{left:0;top:0;white-space:nowrap;font:400 120px/124px var(--font-display);color:var(--oi-ink);transform-origin:50% 50%}
.pf-op{font:800 64px/64px var(--font-text);color:var(--oi-muted);padding:0 22px}
.pf-note{left:60px;width:960px;top:1226px;text-align:center;font:800 40px/48px var(--font-text);color:var(--oi-muted)}
.pd-img{display:block;max-width:none}
.pd-name{text-align:center;font:400 72px/76px var(--font-display);color:var(--oi-ink);white-space:nowrap}
.pd-q{text-align:center;font:800 36px/42px var(--font-text);color:var(--oi-accent);white-space:nowrap}
.vf-pa .vf-date--pa{font-size:148px;line-height:136px;transform-origin:0 100%}
.pq{left:60px;width:960px;top:720px}
.pq-open{position:absolute;left:0;top:-40px;font:400 150px/150px var(--font-display);color:var(--oi-accent)}
.pq-line{margin-left:100px;font:700 46px/60px var(--font-text);color:var(--oi-ink);white-space:nowrap}
.pq-close{color:var(--oi-accent)}
.pq-w{position:relative}
.pq-u{position:absolute;left:0;right:0;bottom:-2px;height:7px;background:var(--oi-accent);transform-origin:0 50%}
.pq-src{margin:14px 0 0 100px;font:700 26px/32px var(--font-text);color:var(--oi-muted)}
.pwds{left:60px;width:960px;top:1044px;text-align:center}
.pwd{font:800 54px/64px var(--font-text);color:var(--oi-ink);white-space:nowrap}
.pwd-arrow{color:var(--oi-muted)}
/* Subtitles on parchment (decision 8): ink without outline, the lit word on
   an accent box in #fffaf0. */
#subtitles.sub-pa .sub-line{color:var(--ink);filter:none}
#subtitles.sub-pa .sub-text{-webkit-text-stroke-width:0}
#subtitles.sub-pa .lit{background:var(--accent);color:#fffaf0;box-shadow:6px 0 0 var(--accent),-6px 0 0 var(--accent)}
.vf-pill{margin-top:30px;display:inline-block;font:800 34px/40px var(--font-text);letter-spacing:.04em;text-transform:uppercase;color:var(--oi-accent);--sw:4px;border:3px solid var(--oi-accent);border-radius:999px;padding:14px 40px;box-shadow:0 0 0 2px var(--oi-stroke),inset 0 0 0 2px var(--oi-stroke)}
.vf-foot{position:absolute;left:60px;width:960px;bottom:134px;display:flex;flex-direction:column;gap:4px}
.vf-key{display:flex;align-items:center;gap:14px;font:800 26px/32px var(--font-text);--sw:4px;margin-bottom:10px}
.vf-key i{width:34px;height:24px;border-radius:3px;flex:none;box-shadow:0 0 0 2px var(--oi-stroke)}
/* 1.10.0: the source and the credit at 26/32, the credit in the cream ink;
   on-image-muted stays for the fixed labels. */
.vf-src{font:700 26px/32px var(--font-text);--sw:5px}
.vf-cred{font:700 26px/32px var(--font-text);color:var(--oi-ink);--sw:5px}
/* 1.10.0: a calm zone, the card's picture blurred by 9 px under a block of
   small text, faded out over its outer 40 px by two intersected gradients. */
.vf-calm{position:absolute;overflow:hidden;pointer-events:none;-webkit-mask-composite:source-in;mask-composite:intersect}
.vf-calm img{position:absolute;max-width:none;display:block;filter:blur(9px)}
.vf-sign{display:flex;align-items:center;gap:14px}
.vf-sign img{width:44px;height:44px;display:block;filter:drop-shadow(0 0 2px rgba(11,8,6,.95)) drop-shadow(0 1px 6px rgba(11,8,6,.6))}
.vf-sign b{font:600 32px/38px var(--font-wordmark);--sw:4px}
#signature{position:absolute;left:60px;top:1836px;height:48px;z-index:3}
.vf-close-foot{position:absolute;left:0;right:0;bottom:36px;display:flex;flex-direction:column;align-items:center;gap:12px}
.vf-close-foot .vf-cred{text-align:center;max-width:900px}
.vf-close-foot .vf-sign img{width:56px;height:56px}
.vf-close-foot .vf-sign b{font-size:44px;line-height:48px;--sw:5px}
.vf-demo{position:absolute;right:60px;top:178px;z-index:9;background:var(--demo-tape,#ffe58a);color:var(--demo-ink,#2b2100);font:800 22px/28px var(--font-text);letter-spacing:.06em;text-transform:uppercase;padding:10px 22px;border-radius:999px;white-space:nowrap}
/* Subtitles: Vidéo carte 0.4.0 (social/video/page.mjs): Nunito Sans 800
   56/68, a 9 px dark stroke under the letters; the spoken word in accent, its
   text in on-accent. Lines from y 1316 to 1452, centred on x 540, at most
   900 px wide. 1.9.0: each line takes the ring of its 9 px outline, r = 5,
   in place of the soft shadow, and the lit box gets a 2 px dark edge and a
   shadow; the line's ring goes round the box. */
#subtitles{position:absolute;left:60px;top:1316px;width:960px;height:136px;display:flex;flex-direction:column;justify-content:center;z-index:4}
.sub-line{text-align:center;white-space:pre;font:800 56px/68px var(--font-text);color:var(--oi-text);filter:url(#oi-ring-5)}
.sub-text{-webkit-text-stroke:9px var(--oi-stroke);paint-order:stroke fill}
.lit{background:var(--oi-accent);color:var(--oi-on-accent);border-radius:6px;-webkit-text-stroke:0;
  box-shadow:6px 0 0 var(--oi-accent),-6px 0 0 var(--oi-accent),6px 0 0 2px var(--oi-stroke),-6px 0 0 2px var(--oi-stroke),0 0 12px 4px rgba(11,8,6,.55)}
</style></head><body><div id="frame"></div>
<svg id="sm-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs></defs></svg>
<script>
${OVERLAY_SCRIPT}
document.querySelector("#sm-defs defs").insertAdjacentHTML("beforeend", hatchDefs());
// 1.11.0: an arrow in the key, in each ink and in the colonial power's cream.
for (const [k, v] of Object.entries({ ...INK, w: ${JSON.stringify(MARKS.foreign)} }))
  SWATCHES["arrow-" + k] = '<path d="M3 12 L28 12" stroke="#0b0806" stroke-opacity=".7" stroke-width="11" stroke-linecap="round"/><path d="M3 12 L28 12" stroke="' + v + '" stroke-width="5" stroke-linecap="round"/><path d="M41 12 L27 4 L30 12 L27 20 Z" fill="' + v + '" stroke="#0b0806" stroke-opacity=".7" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/>';
const SAT_VERT = ${JSON.stringify(FLAT_VERT)};
const SAT_FRAG = ${JSON.stringify(FLAT_FRAG)};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const resolveAsset = (name) => "/assets/" + name;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
// The cards' French spacing (EthniCards' fr): a narrow no-break space before
// ; : ! ? » and after «.
const fr = (s) => s.replace(/[ \\u00a0]+([;:!?»])/g, "\\u202f$1").replace(/«[ \\u00a0]+/g, "«\\u202f");
const MONTHS = "(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)";
const DATE_STEPS = [[176, 156], [148, 136], [124, 118], [104, 100]];
const layers = [];
const runs = [];
let logoUrl = null;

function signature() {
  return el("div", "vf-sign", '<img src="' + logoUrl + '" alt=""><b class="oi">EthniAfrica</b>');
}

// One layer per card, built once from the design system's own render of the
// card for a video: its band, head, sources and signature words.
function buildLayer(spec, view) {
  const parts = buildParts(spec, view);
  noBreak(parts.layer);
  return parts;
}

// 1.7.0: no text breaks inside a hyphenated word (« finit-il », « dit-on »),
// as 1.6.0 rules for « nous-mêmes ».
function noBreak(root) {
  root.querySelectorAll(".vf-title, .vf-kick, .vf-txt, .vf-rlab, .vf-by, .vf-flab, .vf-nm, .vf-rl, .vf-sent, .vf-next").forEach((box) => {
    const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const t of nodes) {
      if (!/\\S-\\S/.test(t.nodeValue)) continue;
      const f = document.createDocumentFragment();
      t.nodeValue.split(/(\\S+-\\S+)/).forEach((part, i) => {
        if (i % 2) f.append(el("span", "vf-nowrap", esc(part)));
        else if (part) f.append(document.createTextNode(part));
      });
      t.replaceWith(f);
    }
  });
}

// The chapter card (operator, 20 October 2026): its dark ground and glow are
// its picture, so they cross-fade like one; its text animates on the card's
// own clock (drawChapter).
function silentParts(parts) {
  const { spec, layer, pic } = parts;
  const ground = el("div", "vf-chapground");
  const glow = el("div", "vf-chapglow");
  ground.append(glow);
  pic.append(ground);
  const box = el("div", "vf-chap");
  const dots = el("div", "vf-chapdots");
  const line = el("span", "vf-chapline");
  dots.append(line);
  const marks = [];
  for (let k = 1; k <= spec.chapter.of; k++) {
    const dot = el("span", "vf-chapdot" + (k < spec.chapter.n ? " done" : k === spec.chapter.n ? " now" : ""));
    if (k === spec.chapter.n) dot.append(el("span", "vf-chapring"));
    dots.append(dot);
    marks.push(dot);
  }
  const track = el("div", "vf-chaptrack");
  track.append(dots);
  const count = el("div", "vf-chapcount", "<b>" + spec.chapter.n + "</b> sur " + spec.chapter.of);
  count.dataset.kind = "chapter-count";
  const title = el("h2", "vf-chaptitle", esc(fr(spec.chapter.title)));
  title.dataset.kind = "chapter-title";
  box.append(track, count, title);
  layer.append(box);
  parts.chapter = { glow, line, dots: marks, ring: dots.querySelector(".vf-chapring"), count, title };
  return parts;
}

// The board's timings, in seconds from the card's first frame: the line, the
// dots one by one, the ring on the current dot, « n sur N », the title.
const CHAPTER_STEPS = { line: [0.25, 0.7], dot0: 0.3, dotStep: 0.12, dot: 0.32, ring: [1.0, 0.7], count: [1.0, 0.4], title: [1.25, 0.6] };
const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const span = (t, [from, length]) => Math.min(1, Math.max(0, (t - from) / length));
function drawChapter(c, t, fade) {
  const S = CHAPTER_STEPS;
  c.glow.style.transform = "translate(" + (-60 + 14 * t).toFixed(1) + "px," + (-30 + 7 * t).toFixed(1) + "px)";
  c.line.style.transform = "scaleX(" + easeOut(span(t, S.line)).toFixed(4) + ")";
  c.dots.forEach((d, k) => {
    const p = easeOut(span(t, [S.dot0 + k * S.dotStep, S.dot]));
    d.style.opacity = (p * fade).toFixed(4);
    d.style.transform = "scale(" + (0.4 + 0.6 * p).toFixed(4) + ")";
  });
  if (c.ring) {
    const p = span(t, S.ring);
    c.ring.style.opacity = p > 0 && p < 1 ? (0.9 * (1 - p)).toFixed(4) : "0";
    c.ring.style.transform = "scale(" + (0.6 + 0.9 * p).toFixed(4) + ")";
  }
  c.count.style.opacity = (span(t, S.count) * fade).toFixed(4);
  const p = easeOut(span(t, S.title));
  c.title.style.opacity = (p * fade).toFixed(4);
  c.title.style.transform = "translateY(" + (24 * (1 - p)).toFixed(2) + "px)";
}

// The series idents (operator, 19 October 2026): the intro bumper and the
// end card are drawn by their own page (social/series-idents) in a frame the
// size of the video, which drawFrame moves to the ident's own time. The end
// card replaces the closing card's 1.10.0 block, so nothing else is built.
function identParts(spec) {
  const layer = el("div", "vf-layer");
  const pic = el("div", "vf-pic");
  layer.append(pic);
  const query = new URLSearchParams({ t: "0" });
  if (spec.outro) {
    query.set("layers", spec.outro.layers);
    if (spec.outro.next) query.set("next", spec.outro.next);
  }
  const frame = document.createElement("iframe");
  frame.className = "vf-ident";
  frame.setAttribute("width", "1080");
  frame.setAttribute("height", "1920");
  frame.src = "/repo/social/series-idents/" + (spec.outro ? "endcard" : "ident") + ".html?" + query;
  pic.append(frame);
  return { spec, layer, pic, text: [], photo: null, map: null, date: null, slot: false, closing: spec.type === "closing", ident: { frame, clip: spec.outro ? "outro" : "intro" } };
}
const identReady = (parts) => new Promise((ok, fail) => {
  const started = Date.now();
  const check = () => {
    const w = parts.ident.frame.contentWindow;
    if (w && w.identReady === true) return ok();
    if (Date.now() - started > 20000) return fail(new Error("The " + parts.ident.clip + " ident did not load"));
    setTimeout(check, 50);
  };
  check();
});

function buildParts(spec, view) {
  if (spec.type === "intro" || spec.outro) return identParts(spec);
  const silent = spec.type === "chapter";
  // 1.12.0: a parchment text card's date is a string the video sets itself.
  const pa = spec.ground === "parchment";
  const textCard = pa && typeof spec.date === "string";
  const card = silent ? null : EthniCards.render(textCard ? { ...spec, date: undefined } : spec, { context: "video", resolve: resolveAsset, demo: false });
  const pick = (sel) => card.querySelector(sel);
  const layer = el("div", "vf-layer");
  const pic = el("div", "vf-pic");
  layer.append(pic);
  const parts = { spec, layer, pic, text: [], photo: null, map: null, date: null, slot: false, closing: spec.type === "closing" };
  const src = pa ? "" : (spec.image && spec.image.src) || "";
  if (pa) {
    parts.pa = true;
    layer.classList.add("vf-pa");
    layer.dataset.theme = "parchemin";
    parts.ground = groundLayer(pic);
  } else if (view && view.sequence) {
    // 1.5.0: the card's map is its run's, drawn by drawRun; the card brings
    // its head and foot.
    parts.seqView = view;
  } else if (view) {
    parts.map = mapLayer(view);
    parts.photo = parts.map;
    parts.view = view;
    parts.scale = view.scale;
    pic.append(parts.map);
  } else if (/(^|\\/)a-trouver-[^/]*$/.test(src)) {
    pic.append(el("div", "vf-slot"));
    const t = el("div", "vf-slot-text");
    t.append(el("div", "vf-slot-label oi", "Image à trouver"));
    if (spec.image.find) t.append(el("div", "vf-slot-find oi", esc(fr(spec.image.find))));
    layer.append(t);
    parts.text.push(t);
    parts.slot = true;
  } else if (src && spec.image.document) {
    parts.doc = documentLayer(spec, pic);
    parts.photo = parts.doc.sharp;
    parts.scale = parts.doc.frame.scale;
  } else if (src) {
    const img = new Image();
    img.alt = "";
    img.decoding = "sync";
    img.src = resolveAsset(src);
    pic.append(img);
    parts.photo = img;
    parts.focus = spec.image.focus || [0.5, 0.5];
  }
  if (silent) return silentParts(parts);
  if (parts.closing) {
    const close = el("div", "vf-close");
    // 1.10.0: the closing line and the fixed invitation, from the cards' own
    // constants, never the card's body: the video keeps no copy of either.
    const line = el("div", "vf-sigline oi oi-l");
    line.setAttribute("lang", "fr");
    EthniCards.signatureLines.forEach((t) => line.append(el("span", "", esc(t))));
    close.append(line);
    const invitation = el("div", "vf-sent oi");
    invitation.setAttribute("lang", "fr");
    EthniCards.invitationLines.forEach((t) => invitation.append(el("span", "", esc(t))));
    close.append(invitation);
    const pill = pick(".ec-cta-pill");
    close.append(el("div", "vf-pill oi", esc((pill ? pill.textContent : "ethniafrica.com").toUpperCase())));
    // 1.7.0: the next episode, printed 30 px under the pill, on one line.
    if (spec.next) close.append(el("div", "vf-next oi", "<em>" + fr("Prochain épisode :") + "</em> " + esc(fr(spec.next))));
    layer.append(close);
    const foot = el("div", "vf-close-foot");
    if (pick(".ec-credit")) foot.append(el("div", "vf-cred oi", pick(".ec-credit").innerHTML));
    foot.append(signature());
    layer.append(foot);
    parts.text.push(close, foot);
    return parts;
  }
  const head = el("div", "vf-head");
  // 1.7.0: in the video, the chapter (« 3 · Le nom s'étend ») or « Nous
  // pensons » replaces the card's own kicker, which the carousel keeps.
  const kicker = pick(".ec-kicker");
  if (spec.videoKicker) head.append(el("div", "vf-kick oi", esc(fr(spec.videoKicker))));
  else if (kicker && kicker.textContent.trim()) head.append(el("div", "vf-kick oi", kicker.innerHTML));
  if (textCard) {
    // 1.12.0: the dated head of 1.7.0 in Parchemin inks, the date at 148/136.
    parts.paDate = el("div", "vf-date vf-date--pa oi", esc(spec.date).replace(/ /g, "\\u00a0"));
    head.append(parts.paDate);
    if (spec.dateLabel) {
      parts.paLabel = el("div", "vf-label oi", esc(fr(spec.dateLabel)));
      head.append(parts.paLabel);
    }
  } else if (spec.date) {
    // A date is one group: day, month and year never part.
    const html = pick(".ec-date").innerHTML
      .replace(new RegExp("(\\\\d+(?:er|<sup>er</sup>)?) " + MONTHS + " (\\\\d{3,4})", "g"), "$1\\u00a0$2\\u00a0$3")
      .replace(new RegExp(MONTHS + " (\\\\d{3,4})", "g"), "$1\\u00a0$2");
    parts.date = el("div", "vf-date oi oi-l", html);
    head.append(parts.date);
    const name = pick(".ec-field .ec-field-name");
    if (name) {
      head.append(el("div", "vf-label oi", pick(".ec-field .ec-label").innerHTML));
      head.append(el("div", "vf-name oi oi-l", name.innerHTML));
    }
  } else {
    head.append(el("h2", "vf-title oi oi-l" + (spec.type === "opener" ? " vf-title--xl" : ""), pick(".ec-title").innerHTML));
  }
  // 1.7.0: readings and figures flow under the title, each item in place
  // from the card's first frame and entering on its word.
  if (spec.readings) {
    const list = el("div", "vf-list");
    for (const it of spec.readings.items) {
      const row = el("div", "vf-row");
      if (it.label) row.append(el("div", "vf-rlab oi", esc(fr(it.label))));
      row.append(el("div", "vf-txt oi", esc(fr(it.text))));
      if (it.by) row.append(el("div", "vf-by oi", esc(fr(it.by))));
      list.append(row);
    }
    head.append(list);
    parts.items = [...list.children];
  }
  if (spec.figures) {
    const grid = el("div", "vf-figs");
    for (const it of spec.figures.items) {
      const cell = el("div", "vf-fig");
      // French numbers: « 2 000 », a narrow no-break space between groups.
      const value = (it.pre ? '<i class="oi">' + esc(fr(it.pre)) + "</i>" : "") + esc(it.value).replace(/ /g, "\\u202f") + (it.unit ? '<small class="oi">' + esc(fr(it.unit)) + "</small>" : "");
      cell.append(el("div", "vf-val oi oi-l", value));
      cell.append(el("div", "vf-flab oi", esc(fr(it.label))));
      grid.append(cell);
    }
    head.append(grid);
    parts.items = [...grid.children];
  }
  if (spec.sbs) head.append(sideBySide(spec.sbs, parts));
  if (spec.week && !pa) head.append(weekTable(spec.week, parts));
  layer.append(head);
  if (pa) parchmentContent(spec, parts);
  else if (spec.formula) {
    parts.formula = formulaLayer(spec.formula);
    layer.append(parts.formula.box);
    parts.text.push(parts.formula.box);
  }
  // 1.7.0: the quoted person, left on x 60, its bottom at y 1296.
  if (spec.attribution) {
    const who = el("div", "vf-attr");
    who.append(el("div", "vf-nm oi", esc(fr(spec.attribution.name))));
    who.append(el("div", "vf-rl oi", esc(fr(spec.attribution.role))));
    layer.append(who);
    parts.attribution = who;
  }
  const foot = el("div", "vf-foot");
  // 1.7.0: a signed card names EthniAfrica's position where a source would be.
  if (spec.signed) {
    const line = el("div", "vf-src oi", "Position d'EthniAfrica");
    line.dataset.kind = "source";
    foot.append(line);
  }
  if (view) {
    // The key as text with the satellite swatches, two columns from three
    // items; then the source without its base map clause and the imagery.
    const box = view.key.length >= 3 ? el("div", "vf-keys") : foot;
    if (box !== foot) foot.append(box);
    for (const item of view.key) {
      const swatch = item.swatch === "text" ? "" : '<svg viewBox="0 0 44 24">' + SWATCHES[item.swatch] + "</svg>";
      const key = el("div", "vf-key oi", swatch + "<span>" + esc(fr(item.label)) + "</span>");
      key.dataset.kind = "key";
      if (item.file) key.dataset.file = item.file;
      box.append(key);
    }
    const lines = [["vf-src", "source", view.credits.source && "Source : " + view.credits.source], ["vf-cred", "credit", view.credits.imagery]];
    // 1.11.0: during the globe the credit names the imagery alone; the
    // 1.4.1 line takes its place from the first mark on (drawFrame).
    if (view.credits.globe) lines.push(["vf-cred", "credit", view.credits.globe]);
    for (const [cls, kind, text] of lines) {
      if (!text) continue;
      const line = el("div", cls + " oi", esc(fr(text)));
      line.dataset.kind = kind;
      if (view.credits.globe && kind === "credit") {
        line.dataset.credit = text === view.credits.globe ? "globe" : "map";
        parts.credits = (parts.credits || []).concat(line);
      }
      foot.append(line);
    }
  }
  // 1.12.0: drawings are illustrations, never evidence; the foot says so.
  if (pa && spec.drawings) {
    const line = el("div", "vf-src oi", fr(spec.drawings.length > 1 ? "Dessins : illustrations d’EthniAfrica, pas des documents" : "Dessin : illustration d’EthniAfrica, pas un document"));
    line.dataset.kind = "source";
    foot.append(line);
  }
  for (const [sel, cls, kind] of [[".ec-source", "vf-src", "source"], [".ec-credit", "vf-cred", "credit"]]) {
    const line = pick(sel);
    // A slot's credit only says the image is missing: the slot says it. A
    // parchment card shows no picture, so it credits none.
    if (line && !(kind === "credit" && (parts.slot || pa))) {
      // 1.7.0: « Sources » or « Hypothèses » in place of the default label.
      const html = kind === "source" && spec.sourceLabel ? line.innerHTML.replace(/^Source/, esc(spec.sourceLabel)) : line.innerHTML;
      const div = el("div", cls + " oi", html);
      div.dataset.kind = kind;
      foot.append(div);
    }
  }
  layer.append(foot);
  parts.text.push(head, foot);
  return parts;
}

// 1.8.0: a page of text framed on its quoted passage (documentFrame, the
// engine's own function). The page is drawn twice: blurred by 7 px over the
// frame, and sharp under a mask opaque from 48 px above to 48 px below the
// passage, fading over 90 px. Both zoom around (540, 1000). The underline
// sits in the sharp layer, so it zooms with the page; two empty probes
// report the passage and the sharp band as drawn, zoom included.
function documentLayer(spec, pic) {
  const image = spec.image, doc = image.document, f = documentFrame(image);
  const stage = (blur) => {
    const st = el("div", "vf-doc");
    Object.assign(st.style, {
      left: f.left + "px", top: f.top + "px", width: f.width + "px", height: f.height + "px",
      transformOrigin: 540 - f.left + "px " + (1000 - f.top) + "px",
    });
    if (doc.pad) st.style.background = doc.padColor || "#ffffff";
    if (blur) st.style.filter = "blur(" + blur + "px)";
    const img = new Image();
    img.alt = "";
    img.decoding = "sync";
    img.src = resolveAsset(image.src);
    Object.assign(img.style, { left: "0px", top: f.pad + "px", width: image.w * f.scale + "px", height: image.h * f.scale + "px" });
    st.append(img);
    pic.append(st);
    return st;
  };
  const blurred = stage(f.blur), sharp = stage(0);
  const a = f.sharp[0] - f.top, b = f.sharp[1] - f.top;
  sharp.style.webkitMaskImage = sharp.style.maskImage = "linear-gradient(to bottom, transparent " + (a - f.fade) + "px, #000 " + a + "px, #000 " + b + "px, transparent " + (b + f.fade) + "px)";
  const probe = (y, h) => {
    const p = el("div", "vf-probe");
    Object.assign(p.style, { top: y + "px", height: h + "px" });
    sharp.append(p);
    return p;
  };
  const passage = probe(f.passage.y - f.top, f.passage.h);
  Object.assign(passage.style, { left: f.passage.x - f.left + "px", width: f.passage.w + "px" });
  const band = probe(a, b - a);
  const marks = (doc.marks || []).map(([x, y, w, h]) => {
    const m = el("div", "vf-mark");
    Object.assign(m.style, { left: x * f.scale + "px", top: f.pad + (y + h) * f.scale + 5 + "px", width: w * f.scale + "px" });
    sharp.append(m);
    return m;
  });
  return { frame: f, blurred, sharp, marks, passage, band };
}

// 1.8.0: the name-making formula. Each step is a whole state, set in place
// from the card's first frame; the engine fades one out as the next comes in.
const accentWords = (t) => esc(fr(t)).replace(/\\*([^*]+)\\*/g, '<span class="fx-r">$1</span>');
function formulaLayer(formula) {
  const box = el("div", "vf-fx");
  const steps = formula.steps.map((step) => {
    const st = el("div", "vf-fx-step");
    if (step.day) st.append(el("div", "fx-dayline oi", accentWords(step.day)));
    for (const row of step.rows) {
      if (row.label) st.append(el("div", "fx-lab oi", accentWords(row.label)));
      const html = row.parts.map((p) => '<span class="' + (p.role === "op" ? "fx-op" : "fx-p-" + p.role) + '">' + accentWords(p.text) + "</span>").join("");
      st.append(el("div", "fx-eq oi oi-l", html));
    }
    if (step.note) st.append(el("div", "fx-note oi", accentWords(step.note)));
    box.append(st);
    return st;
  });
  return { box, steps };
}
// A formula line takes the largest of 120, 104 and 88 px that holds in 960 px.
const FORMULA_STEPS = [[120, 124, 64], [104, 108, 56], [88, 92, 48]];
function setFormula(parts) {
  for (const eq of parts.formula.box.querySelectorAll(".fx-eq")) {
    for (const [size, line, op] of FORMULA_STEPS) {
      eq.style.fontSize = size + "px";
      eq.style.lineHeight = line + "px";
      eq.querySelectorAll(".fx-op").forEach((o) => (o.style.fontSize = op + "px"));
      eq.dataset.size = size;
      if (inkBox(eq).w <= 960) break;
    }
  }
}

// 1.8.0: two columns of forms, rows entering with the voice, the days on
// their word, the note under the rows.
function sideBySide(sbs, parts) {
  const grid = el("div", "vf-sbs");
  for (const h of sbs.heads) grid.append(el("div", "sbs-hd oi", esc(fr(h))));
  const rows = [], days = [];
  for (const row of sbs.rows) {
    rows.push(row.map((c) => {
      const cell = el("div", "sbs-cell");
      cell.append(el("div", "sbs-nm oi oi-l", esc(fr(c.name))));
      const day = el("div", "sbs-dy oi", esc(fr(c.day)));
      days.push(day);
      cell.append(day);
      grid.append(cell);
      return cell;
    }));
  }
  const note = sbs.note ? el("div", "sbs-note oi", esc(fr(sbs.note))) : null;
  if (note) grid.append(note);
  parts.sbs = { rows, days, note };
  return grid;
}

// 1.8.0: the week table: seven days, two sides, the boy's and the girl's
// names over the day's own word.
function weekTable(week, parts) {
  const grid = el("div", "vf-week");
  for (const h of ["", ...week.heads]) grid.append(el("div", "wk-hd oi", esc(fr(h))));
  for (const h of ["", "garçon · fille", "garçon · fille"]) grid.append(el("div", "wk-sub oi", esc(h)));
  const rows = week.rows.map(([day, ...sides]) => {
    const cells = [el("div", "wk-dn oi", esc(fr(day)))];
    for (const [word, boy, girl] of sides)
      cells.push(el("div", "wk-nm oi", esc(fr(boy)) + " · " + esc(fr(girl)) + '<span class="wk-dw oi">' + esc(fr(word)) + "</span>"));
    grid.append(...cells);
    return cells;
  });
  parts.week = { rows };
  return grid;
}

// 1.12.0: the idents' ground (social/series-idents/ground.css), moved by the
// engine with the idents' own numbers (ground.mjs).
function groundLayer(pic) {
  const g = el("div", "vf-ground");
  const parch = el("div", "ground-parch"), glow = el("div", "ground-glow"), grain = el("div", "ground-grain");
  g.append(parch, glow, grain);
  pic.append(g);
  return { glow, grain };
}
// « <r>ya</r> » marks the day's part in the card data, as the handoff writes it.
const dayParts = (html) => esc(fr(html.replace(/<\\/?r>/g, "\\u0001"))).replace(/\\u0001([^\\u0001]*)\\u0001/g, '<span class="pf-r">$1</span>');

// The week table one people per card, the formula in motion, drawings, the
// quotation and free words: each in the layer at the places of the boards.
function parchmentContent(spec, parts) {
  const box = el("div", "pa-abs");
  parts.layer.append(box);
  parts.text.push(box);
  parts.paBox = box;
  if (spec.week) {
    const w = spec.week;
    box.append(el("div", "pw-people oi", esc(fr(w.people)) + (w.region ? "<span> · " + esc(fr(w.region)) + "</span>" : "")));
    const lab = (text, css) => { const n = el("div", "pw-lab oi", esc(text)); n.style.cssText = css; box.append(n); };
    lab("fille", "right:680px");
    lab("jour", "left:400px;width:280px;text-align:center");
    lab("garçon", "left:680px");
    parts.paWeek = w.rows.map(([day, word, girl, boy], k) => {
      const row = el("div", "pw-row");
      row.style.top = 590 + 96 * k + "px";
      const band = el("div", "pw-band");
      const cells = [el("div", "pw-name pw-girl oi", esc(fr(girl))), el("div", "pw-day", '<div class="pw-dn oi">' + esc(fr(day)) + '</div><div class="pw-dw oi">' + esc(fr(word)) + "</div>"), el("div", "pw-name pw-boy oi", esc(fr(boy)))];
      row.append(band, ...cells, el("div", "pw-rule"));
      box.append(row);
      return { row, band, cells };
    });
  }
  if (spec.formula && spec.formulaPlan) {
    const plan = spec.formulaPlan;
    const fx = { day: null, lines: [], notes: [] };
    if (plan.day) { fx.day = el("div", "pf-day oi", dayParts(plan.day.html)); box.append(fx.day); }
    plan.lines.forEach((line, n) => {
      const top = FORMULA_LINES[n];
      const label = el("div", "pf-lab oi", esc(fr(line.label || "")));
      label.style.top = top - 42 + "px";
      box.append(label);
      // One span per piece and per text it takes, so a change of form
      // cross-fades two spans in place.
      const spans = {};
      for (const snap of line.snapshots)
        for (const p of snap.pieces) {
          const key = pieceKey(p);
          if (spans[key]) continue;
          const s = el("span", "pf-piece oi" + (p.op ? " pf-op" : ""), p.op ? esc(p.op) : pieceHtml(p));
          s.style.opacity = "0";
          box.append(s);
          spans[key] = s;
        }
      fx.lines.push({ top, label, spans, snapshots: line.snapshots, rest: null });
    });
    for (const note of plan.notes) { const n = el("div", "pf-note oi", dayParts(note.html)); box.append(n); fx.notes.push(n); }
    parts.paFormula = fx;
  }
  if (spec.drawings) {
    const two = spec.drawings.length === 2;
    const W = two ? 470 : 560, H = Math.round((W * 132) / 160), top = two ? 610 : 600;
    parts.paDrawings = spec.drawings.map((d, k) => {
      const left = two ? (k ? 550 : 60) : 260;
      const img = el("img", "pd-img");
      img.alt = "";
      img.decoding = "sync";
      img.src = "/design/assets/Illustrations/" + d.kind + ".svg";
      Object.assign(img.style, { left: left + "px", top: top + "px", width: W + "px", height: H + "px" });
      const name = el("div", "pd-name oi", esc(fr(d.name)));
      const quality = el("div", "pd-q oi", esc(fr(d.quality)));
      // Centred under the drawing; a long quality may pass its width.
      for (const [n, y] of [[name, top + H + 6], [quality, top + H + 82]]) Object.assign(n.style, { left: left + W / 2 - 480 + "px", width: "960px", top: y + "px" });
      box.append(img, name, quality);
      return { img, name, quality };
    });
  }
  if (spec.quote && spec.quote.lines) {
    const q = el("div", "pq");
    q.append(el("div", "pq-open oi", "«"));
    const marks = (spec.quote.marks || []).map(() => null);
    const lines = spec.quote.lines.map((text, k) => {
      let html = esc(fr(text));
      (spec.quote.marks || []).forEach((m, j) => {
        const words = esc(fr(m.words));
        if (marks[j] === null && html.includes(words)) {
          html = html.replace(words, '<span class="pq-w" data-mark="' + j + '"><span>' + words + '</span><span class="pq-u"></span></span>');
          marks[j] = k;
        }
      });
      if (k === spec.quote.lines.length - 1) html += '<span class="pq-close">\\u202f»</span>';
      const line = el("div", "pq-line oi", html);
      q.append(line);
      return line;
    });
    const source = spec.quote.source ? el("div", "pq-src oi", esc(fr(spec.quote.source))) : null;
    if (source) q.append(source);
    box.append(q);
    parts.paQuote = { box: q, lines, source, marks: [...q.querySelectorAll(".pq-w")].sort((a, b) => a.dataset.mark - b.dataset.mark) };
  }
  if (spec.words) {
    const w = el("div", "pwds");
    parts.paWords = spec.words.map((word) => {
      const line = el("div", "pwd oi", dayParts(word.html).replace(/→/g, '<span class="pwd-arrow">→</span>'));
      w.append(line);
      return line;
    });
    box.append(w);
  }
}

// 1.12.0: the formula in motion. Lines at y 760 and 980; each state's pieces
// laid out on their line and centred at x 540, a joined piece touching the
// one before it, a fallen one 104 px under where it was, at 55 % and 30 %.
const FORMULA_LINES = [760, 980];
const FALL = { drop: 104, scale: 0.55, opacity: 0.3 };
const pieceKey = (p) => (p.op ? p.id : p.id + "|" + p.text);
function pieceHtml(p) {
  const t = [...p.text];
  const [a, b] = p.day === true ? [0, t.length] : Array.isArray(p.day) ? p.day : [0, 0];
  return esc(t.slice(0, a).join("")) + (b > a ? '<span class="pf-day-part">' + esc(t.slice(a, b).join("")) + "</span>" : "") + esc(t.slice(b).join(""));
}
function setMovingFormula(parts) {
  for (const line of parts.paFormula.lines) {
    const spans = Object.values(line.spans);
    const widths = () => line.snapshots.map((s) => s.pieces.filter((p) => !p.fallen).reduce((w, p) => w + line.spans[pieceKey(p)].getBoundingClientRect().width, 0));
    for (const [size, height, op] of FORMULA_STEPS) {
      spans.forEach((s) => {
        s.style.fontSize = (s.classList.contains("pf-op") ? op : size) + "px";
        s.style.lineHeight = (s.classList.contains("pf-op") ? op : height) + "px";
      });
      line.size = size;
      if (Math.max(...widths()) <= 960) break;
    }
    // Each state's resting place: standing pieces side by side, centred; a
    // fallen piece where it fell.
    line.rest = [];
    line.snapshots.forEach((snap, k) => {
      const rest = {};
      const standing = snap.pieces.filter((p) => !p.fallen);
      const w = (p) => line.spans[pieceKey(p)].getBoundingClientRect().width;
      let x = 540 - standing.reduce((n, p) => n + w(p), 0) / 2;
      for (const p of standing) {
        const op = !!p.op;
        rest[pieceKey(p)] = { x, y: line.top + (op ? (line.size + 4 - parseFloat(line.spans[pieceKey(p)].style.lineHeight)) / 2 : 0), scale: 1, opacity: 1 };
        x += w(p);
      }
      for (const p of snap.pieces.filter((p) => p.fallen)) {
        const before = line.rest[k - 1] && line.rest[k - 1][pieceKey(p)];
        rest[pieceKey(p)] = before && before.scale === 1 ? { x: before.x, y: before.y + FALL.drop, scale: FALL.scale, opacity: FALL.opacity } : before;
      }
      line.rest.push(rest);
    });
  }
}
// The moves ease out on the chapter card's cubic (easeOut), never past rest.
function drawMovingFormula(parts, state) {
  const fx = parts.paFormula;
  if (fx.day) fx.day.style.opacity = state.day;
  state.notes.forEach((o, k) => (fx.notes[k].style.opacity = o));
  fx.lines.forEach((line, n) => {
    const s = state.lines[n];
    line.label.style.opacity = s.label;
    const A = s.from >= 0 ? line.rest[s.from] : {};
    const B = s.to >= 0 ? line.rest[s.to] : {};
    const move = s.to >= 0 ? parts.spec.formula.lines[n].states[s.to].move : null;
    const e = easeOut(s.t);
    for (const [key, span] of Object.entries(line.spans)) {
      const a = A[key], b = B[key];
      let p = null;
      const lerp = (u, v) => u + (v - u) * e;
      if (a && b) p = { x: lerp(a.x, b.x), y: lerp(a.y, b.y), scale: lerp(a.scale, b.scale), opacity: lerp(a.opacity, b.opacity) };
      // Appearing: 9 frames rising 12 px; a change of form cross-fades in place.
      else if (b) p = { ...b, y: b.y + (move === "become" ? 0 : 12 * (1 - e)), opacity: b.opacity * e };
      // Leaving: the « + » of a join goes in its first 5 frames.
      else if (a) p = { ...a, opacity: a.opacity * (move === "join" && span.classList.contains("pf-op") ? Math.max(0, 1 - (s.t * 14) / 5) : 1 - e) };
      if (!p || p.opacity <= 0) { span.style.opacity = "0"; span.style.visibility = "hidden"; continue; }
      span.style.visibility = "visible";
      span.style.opacity = p.opacity;
      span.style.transform = "translate(" + p.x + "px," + p.y + "px) scale(" + p.scale + ")";
    }
  });
}

// The photograph covers the frame: its focal point brought to (540, 1000),
// the middle of the clear zone, as far as its edges allow; the slow zoom
// grows around that point.
function placeImage(parts) {
  const img = parts.photo, [fx, fy] = parts.focus;
  const W = img.naturalWidth, H = img.naturalHeight, s = Math.max(1080 / W, 1920 / H);
  const w = W * s, h = H * s;
  const left = Math.min(0, Math.max(1080 - w, 540 - fx * w));
  const top = Math.min(0, Math.max(1920 - h, 1000 - fy * h));
  Object.assign(img.style, { width: w + "px", height: h + "px", left: left + "px", top: top + "px" });
  img.style.transformOrigin = fx * w + "px " + fy * h + "px";
  parts.scale = s;
  parts.focusAt = [left + fx * w, top + fy * h];
}

// A map card on imagery (1.4.1): the satellite video's flat shader at the
// recede grade with no vignette, drawn once into the layer's own canvas;
// the overlays and names over it, in frame pixels at 100 %.
let sat = null;
async function satellite(bounds) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error("WebGL2 unavailable");
  const compile = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, SAT_VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, SAT_FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  // As the satellite video loads its imagery (render.mjs, page.mjs).
  for (const [unit, url, name] of [[0, "/imagery/world.jpg", "world"], [1, "/imagery/region.jpg", "region"]]) {
    const img = await createImageBitmap(await (await fetch(url)).blob(), { colorSpaceConversion: "none" });
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, name), unit);
  }
  gl.uniform4f(gl.getUniformLocation(program, "bounds"), ...bounds);
  gl.uniform1f(gl.getUniformLocation(program, "grade"), 1); // recede
  gl.uniform1f(gl.getUniformLocation(program, "dim"), 0);
  gl.uniform1f(gl.getUniformLocation(program, "plain"), 1); // no vignette
  return { gl, program, canvas };
}
function paintImagery(target, camera, grade = 1) {
  const { gl, program, canvas } = sat;
  gl.viewport(0, 0, 1080, 1920);
  // 1.11.0: the globe runs at the base grade, then recedes (globeGrade).
  gl.uniform1f(gl.getUniformLocation(program, "grade"), grade);
  gl.uniform2f(gl.getUniformLocation(program, "centre"), 540, camera.centreY);
  gl.uniform1f(gl.getUniformLocation(program, "radius"), camera.radius);
  gl.uniform2f(gl.getUniformLocation(program, "view"), camera.lon * Math.PI / 180, camera.lat * Math.PI / 180);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.finish();
  target.getContext("2d").drawImage(canvas, 0, 0);
}
function mapLayer(view) {
  const wrap = el("div", "vf-map");
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  wrap.append(canvas);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", 1080); svg.setAttribute("height", 1920);
  svg.setAttribute("viewBox", "0 0 1080 1920");
  const groups = ["fills", "borders", "edges"].map(() => {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("fill", "none"); g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
    svg.append(g);
    return g;
  });
  const areas = view.areas.map((a) => ({ ...a, opacity: 1 }));
  groups[0].append(...areas.map(areaFill));
  groups[1].append(...view.borders.map((b) => border({ ...b, opacity: 1 })));
  groups[2].append(...areas.map(areaEdge));
  wrap.append(svg);
  for (const p of view.places) {
    const g = el("div", "sm-place");
    const dot = el("div", "sm-dot");
    Object.assign(dot.style, { left: p.x - 8 + "px", top: p.y - 8 + "px" });
    const name = el("div", "sm-place-name sm-name-box", esc(fr(p.name)));
    Object.assign(name.style, { left: p.x + 14 + "px", top: p.y - 16 + "px" });
    g.append(dot, name);
    wrap.append(g);
  }
  for (const n of view.names) {
    const name = el("div", "sm-name sm-name-box sm-" + n.style, esc(fr(n.text)));
    const lead = { region: 8, area: 6, water: 4 }[n.style];
    Object.assign(name.style, { left: n.box.x + n.box.w / 2 + "px", top: n.box.y + n.box.h / 2 + "px", fontSize: n.size + "px", lineHeight: n.size + lead + "px" });
    if (n.ink) name.style.color = INK[n.ink];
    wrap.append(name);
  }
  wrap._canvas = canvas;
  return wrap;
}

// 1.5.0: one map per run of a map sequence. Its imagery is painted once per
// still view, in setup; a frame of a change of view repaints it (the only
// frames that do). Its areas and borders are projected from longitude and
// latitude by the engine's own flat projection.
${flatProject.toString()}
${documentFrame.toString()}
const viewImagery = new Map();
let imageryPaints = 0;
const cameraKey = (c) => [c.lon, c.lat, c.radius, c.centreY].join(",");
const ringPath = (camera, ring) =>
  "M" + ring.map(([lon, lat]) => flatProject(camera, lon, lat).map((n) => +n.toFixed(1)).join(",")).join("L");
function runLayer(sequence, r) {
  const wrap = el("div", "vf-map");
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  wrap.append(canvas);
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", 1080); svg.setAttribute("height", 1920);
  svg.setAttribute("viewBox", "0 0 1080 1920");
  const [fills, lines, edges] = ["fills", "borders", "edges"].map(() => {
    const g = document.createElementNS(SVG, "g");
    g.setAttribute("fill", "none"); g.setAttribute("stroke-linecap", "round"); g.setAttribute("stroke-linejoin", "round");
    svg.append(g);
    return g;
  });
  const animated = !!sequence.runs[r].animated;
  const areas = {};
  for (const file of sequence.order) {
    const a = sequence.areas[file];
    if (a.sequence !== sequence.runs[r].sequence) continue;
    if (animated) {
      // 1.11.0: one layer per ink the area takes, all made here in the
      // sequence's order. Made when first needed, they stacked in the order
      // this browser had first drawn them, so a frame drawn first differed
      // from the same frame drawn after others (operator, 19 October 2026).
      areas[file] = { polygons: a.polygons, uncertain: a.uncertain, hatch: a.hatch, layers: {}, paths: [], group: fills };
      for (const ink of a.inks) areaLayer(areas[file], ink);
      continue;
    }
    const spec = { d: "", ink: a.ink, uncertain: a.uncertain, hatch: a.hatch, opacity: 0 };
    const fill = areaFill(spec), edge = areaEdge(spec);
    fills.append(fill); edges.append(edge);
    areas[file] = { polygons: a.polygons, groups: [fill, edge], paths: [...fill.querySelectorAll("path"), ...edge.querySelectorAll("path")] };
  }
  const borderLines = sequence.borders[r];
  let borderPaths = [];
  if (borderLines) {
    const g = border({ d: "", strong: borderLines.strong, opacity: 1 });
    lines.append(g);
    borderPaths = [...g.querySelectorAll("path")];
  }
  let arrows = null;
  if (animated) {
    arrows = document.createElementNS(SVG, "g");
    arrows.setAttribute("stroke-linecap", "round"); arrows.setAttribute("stroke-linejoin", "round");
    svg.append(arrows);
  }
  wrap.append(svg);
  const names = el("div");
  wrap.append(names);
  const ills = animated ? el("div") : null;
  const marks = animated ? el("div") : null;
  if (animated) wrap.append(ills, marks);
  return { wrap, canvas, areas, borderLines, borderPaths, names, key: null, animated, arrows, ills, images: [], pool: {}, marks };
}
function paintRun(node, camera, grade = 1) {
  const key = cameraKey(camera) + (grade === 1 ? "" : "|" + grade);
  if (node.key === key) return;
  node.key = key;
  const cached = viewImagery.get(key);
  if (cached) {
    node.canvas.getContext("2d").drawImage(cached, 0, 0);
  } else {
    paintImagery(node.canvas, camera, grade);
    imageryPaints++;
  }
  for (const a of Object.values(node.areas)) {
    const d = a.polygons.flatMap((p) => p.map((ring) => ringPath(camera, ring) + "Z")).join("");
    a.d = d;
    a.paths.forEach((p) => p.setAttribute("d", d));
  }
  if (node.borderLines) {
    const d = node.borderLines.lines.map((l) => ringPath(camera, l)).join("");
    node.borderPaths.forEach((p) => p.setAttribute("d", d));
  }
}
function drawRun(node, map) {
  paintRun(node, map.camera);
  for (const [file, a] of Object.entries(node.areas)) {
    const shown = map.areas.find((x) => x.file === file);
    a.groups.forEach((g) => g.setAttribute("opacity", shown ? shown.opacity : 0));
  }
  node.names.replaceChildren();
  for (const n of map.names) {
    if (!(n.opacity > 0)) continue;
    const name = el("div", "sm-name sm-name-box sm-seq", '<span class="sm-self">' + esc(fr(n.text)) + "</span>" + (n.lang ? '<span class="sm-lang">' + esc(fr(n.lang)) + "</span>" : ""));
    Object.assign(name.style, { left: n.box.x + n.box.w / 2 + "px", top: n.box.y + n.box.h / 2 + "px", color: INK[n.ink], opacity: n.opacity });
    if (n.lang) name.lastChild.style.opacity = n.opacity > 0 ? n.langOpacity / n.opacity : 0;
    node.names.append(name);
  }
  node.wrap.style.transformOrigin = "540px " + map.camera.centreY + "px";
  node.wrap.style.transform = "scale(" + map.zoom + ")";
}

// 1.11.0, the animated satellite map (series.md « The animated satellite
// map », 2 to 8): every value comes from the engine's frame state; the page
// draws it. Area states by series-map.mjs's own areaStyle, sent as source.
${areaStyle.toString()}
const FOREIGN = ${JSON.stringify(MARKS.foreign)};
const inkOf = (ink) => INK[ink] ?? FOREIGN;
const svgEl = (tag, attrs) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};
function areaLayer(a, ink) {
  const dash = a.uncertain ? { "stroke-dasharray": "16 10" } : {};
  const g = svgEl("g", { opacity: 0 });
  const fill = svgEl("path", a.uncertain ? { fill: "url(#hatch-" + ink + "-" + (a.hatch || 45) + ")", "fill-rule": "evenodd" } : { fill: inkOf(ink), "fill-rule": "evenodd" });
  const keyline = svgEl("path", { fill: "none", stroke: "#0b0806", ...dash });
  const edge = svgEl("path", { fill: "none", stroke: inkOf(ink), ...dash });
  for (const p of [fill, keyline, edge]) { p.setAttribute("d", a.d || ""); a.paths.push(p); }
  g.append(fill, keyline, edge);
  a.group.append(g);
  return (a.layers[ink] = { g, fill, keyline, edge });
}
const drawingInk = {};
const ringed = (n, outline) => { n.style.filter = "url(#oi-ring-" + ringOf(outline) + ")"; return n; };
const WORD_STYLE = { phrase: 6, name: 6, date: 9 };
function drawAnimatedRun(node, map) {
  paintRun(node, map.camera, map.grade);
  for (const [file, a] of Object.entries(node.areas)) {
    const shown = map.areas.find((x) => x.file === file);
    const on = new Set((shown ? shown.inks : []).map((l) => l.ink));
    for (const [ink, layer] of Object.entries(a.layers)) if (!on.has(ink)) layer.g.setAttribute("opacity", 0);
    if (!shown) continue;
    const s = areaStyle(shown.lit);
    for (const l of shown.inks) {
      const layer = a.layers[l.ink];
      if (!layer) throw new Error("Ink " + l.ink + " of " + file + " has no layer made in setup");
      layer.g.setAttribute("opacity", shown.opacity * l.w);
      if (a.uncertain) layer.fill.setAttribute("opacity", s.hatch);
      else layer.fill.setAttribute("fill-opacity", s.fill);
      layer.keyline.setAttribute("stroke-width", s.keyline);
      layer.keyline.setAttribute("stroke-opacity", s.keylineOpacity);
      layer.edge.setAttribute("stroke-width", s.edge);
      layer.edge.setAttribute("stroke-opacity", s.edgeOpacity);
    }
  }
  node.names.replaceChildren();
  for (const n of map.names) {
    if (!(n.opacity > 0)) continue;
    const name = n.style === "country"
      ? el("div", "sm-name sm-name-box sm-region", esc(fr(n.text)))
      : el("div", "sm-name sm-name-box sm-seq", '<span class="sm-self">' + esc(fr(n.text)) + "</span>");
    Object.assign(name.style, { left: n.box.x + n.box.w / 2 + "px", top: n.box.y + n.box.h / 2 + "px", opacity: n.opacity });
    if (n.style === "country") Object.assign(name.style, { fontSize: "44px", lineHeight: "52px" });
    else name.style.color = INK[n.ink];
    name.dataset.mark = "name";
    node.names.append(name);
  }
  // Route arrows: the line over its keyline, the notched head on each tip.
  node.arrows.replaceChildren();
  for (const a of map.marks.arrows) {
    if (!(a.opacity > 0)) continue;
    const g = svgEl("g", { opacity: a.opacity });
    if (a.d) {
      g.append(svgEl("path", { d: a.d, fill: "none", stroke: "#0b0806", "stroke-opacity": 0.7, "stroke-width": a.w + 6 }));
      g.append(svgEl("path", { d: a.d, fill: "none", stroke: inkOf(a.ink), "stroke-width": a.w }));
    }
    for (const h of a.heads) {
      g.append(svgEl("path", { d: h.d, fill: "#0b0806", "fill-opacity": 0.7, stroke: "#0b0806", "stroke-opacity": 0.7, "stroke-width": 6 }));
      const head = svgEl("path", { d: h.d, fill: inkOf(a.ink), stroke: inkOf(a.ink), "stroke-width": 1 });
      head.dataset.head = a.id;
      // Placement keeps words clear of a head at rest; a drawing head passes by.
      head.dataset.drawn = a.k >= 1 ? "1" : "0";
      g.append(head);
    }
    node.arrows.append(g);
  }
  node.marks.replaceChildren();
  // Places: the 1.4.1 dot and name.
  for (const p of map.marks.places) {
    if (!(p.opacity > 0)) continue;
    const dot = el("div", "sm-dot");
    Object.assign(dot.style, { left: p.x - 8 + "px", top: p.y - 8 + "px", opacity: p.opacity });
    node.marks.append(dot);
    if (!(p.nameOpacity > 0)) continue;
    const name = el("div", "sm-place-name sm-name-box", esc(fr(p.name)));
    Object.assign(name.style, { top: p.y - 16 + "px", opacity: p.nameOpacity });
    if (p.side === "left") Object.assign(name.style, { right: 1080 - (p.x - 14) + "px" });
    else name.style.left = p.x + 14 + "px";
    name.dataset.mark = "name";
    node.marks.append(name);
  }
  // Drawings, their foot on their place, with the second contour; the label
  // under each.
  // The drawings' images are made and decoded in setup, three of each
  // kind a run uses, and only placed here: a frame never waits for one.
  node.images.forEach((img) => (img.style.display = "none"));
  const taken = {};
  for (const [n, d] of map.marks.drawings.entries()) {
    const img = node.pool[d.kind][(taken[d.kind] = (taken[d.kind] ?? -1) + 1)];
    const w = (d.h * 160) / 120, h = (d.h * 132) / 120;
    Object.assign(img.style, { display: "block", left: d.x - w / 2 + "px", top: d.y + d.rise - (d.h * 124) / 120 + "px", width: w + "px", height: h + "px", opacity: d.opacity });
    img.dataset.mark = "drawing";
    img.dataset.kind = d.kind;
    img.dataset.of = n;
    if (!(d.labelOpacity > 0)) continue;
    const label = el("div", "sm-lab oi", esc(fr(d.label)));
    Object.assign(label.style, { left: d.x + "px", top: d.y + d.rise + 8 + "px", opacity: d.labelOpacity });
    label.dataset.mark = "name";
    label.dataset.of = n;
    node.marks.append(ringed(label, 4));
  }
  // Words on the map: phrases, dates, a colony's name in its ink.
  for (const w of map.marks.words) {
    const word = el("div", "sm-wd sm-wd-" + w.kind + " oi", w.lines.map((l) => esc(fr(l))).join("<br>"));
    Object.assign(word.style, { left: w.x + "px", top: w.y + "px", opacity: w.opacity });
    if (w.ink) word.style.color = inkOf(w.ink);
    word.dataset.mark = w.word ? "word" : "name";
    if (w.leaving) word.dataset.leaving = "1";
    node.marks.append(ringed(word, WORD_STYLE[w.kind]));
  }
  // A name that changes (series.md, « 8 », B): the old name steps aside
  // with its dates; the new one takes the unchanged outline.
  if (map.marks.rename) {
    for (const [part, cls, outline] of [["from", "sm-wd-country", 8], ["dates", "sm-wd-dates", 4], ["to", "sm-wd-country", 8]]) {
      const t = map.marks.rename[part];
      if (!(t.opacity > 0)) continue;
      const n = el("div", "sm-wd " + cls + " oi", esc(fr(t.text)));
      Object.assign(n.style, { left: t.x + "px", top: t.y + "px", opacity: t.opacity, transform: "translate(-50%,-50%) translateY(" + t.dy + "px) scale(" + t.scale + ")" });
      n.dataset.mark = "name";
      // The old name, its dates and the new name read as one group.
      n.dataset.of = "rename";
      node.marks.append(ringed(n, outline));
    }
  }
  node.wrap.style.transformOrigin = "540px " + map.camera.centreY + "px";
  node.wrap.style.transform = "scale(" + map.zoom + ")";
}

// 1.9.0, the double outline (series.md, « Legibility on light pictures »):
// one filter per radius r, 3 to 8 px. The letters with their outline, grown
// by r, softened by 0.6 px, in on-image-ring (the second contour); the same
// growth blurred by r in on-image-ring-soft (its soft shadow); the text over
// both. The filter region is the board's.
const RINGS = [3, 4, 5, 6, 7, 8];
const ringOf = (outline) => Math.max(3, Math.round(0.6 * outline));
function flood(token) {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--" + token).trim();
  const m = value.match(/^rgba\\((\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([\\d.]+)\\)$/);
  if (!m) throw new Error("Token " + token + " is not an rgba colour: " + value);
  return 'flood-color="rgb(' + m[1] + "," + m[2] + "," + m[3] + ')" flood-opacity="' + m[4] + '"';
}
function ringFilters() {
  const ring = flood("on-image-ring"), soft = flood("on-image-ring-soft");
  document.querySelector("#sm-defs defs").insertAdjacentHTML("beforeend", RINGS.map((r) =>
    '<filter id="oi-ring-' + r + '" x="-10%" y="-40%" width="120%" height="180%" color-interpolation-filters="sRGB">' +
    '<feMorphology in="SourceAlpha" operator="dilate" radius="' + r + '" result="d"/>' +
    '<feGaussianBlur in="d" stdDeviation="0.6" result="ds"/><feFlood ' + ring + '/><feComposite in2="ds" operator="in" result="ring"/>' +
    '<feGaussianBlur in="d" stdDeviation="' + r + '" result="sh"/><feFlood ' + soft + '/><feComposite in2="sh" operator="in" result="soft"/>' +
    '<feMerge><feMergeNode in="soft"/><feMergeNode in="ring"/><feMergeNode in="SourceGraphic"/></feMerge></filter>').join(""));
}
// Each block of text on the image that no other contains takes the ring of
// its outline; the words of a block share it. Subtitle lines take theirs
// from the stylesheet, since they are drawn frame by frame.
function ringText(frame) {
  for (const n of frame.querySelectorAll(TEXT_ON_IMAGE)) {
    if (n.parentElement.closest(TEXT_ON_IMAGE)) continue;
    n.style.filter = "url(#oi-ring-" + ringOf(outlineOf(n)) + ")";
  }
}

// 1.10.0, busy pictures (series.md, « Addendum »): under each block of small
// text (the subtitle lines with the lit box, the ending's four parts, the
// foot, the ending's credit) the zone is the text's extent grown by 16 px.
// On the card's first frame, the picture alone, the busyness of a zone is
// the mean of the 9 × 9 px local standard deviation of L*; when the mean of
// the card's zones is 10 or more, every zone of the card is calm: a copy of
// the picture blurred by 9 px, clipped to the zone grown by 40 px and faded
// over those 40 px, above the picture and under the text.
const CALM = { pad: 16, feather: 40, blur: 9, window: 9, busy: 10 };
const LSTAR = (() => {
  const t = new Float64Array(256);
  for (let v = 0; v < 256; v++) {
    const c = v / 255;
    t[v] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  return t;
})();
// Local standard deviation of L* over a w × h window around each pixel, from
// summed-area tables; the window is cut at the frame's edge.
function localContrast(canvas) {
  const W = 1080, H = 1920, px = canvas.getContext("2d").getImageData(0, 0, W, H).data;
  const S = new Float64Array((W + 1) * (H + 1)), S2 = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) {
    let row = 0, row2 = 0;
    for (let x = 0; x < W; x++) {
      const i = 4 * (y * W + x);
      const Y = 0.2126 * LSTAR[px[i]] + 0.7152 * LSTAR[px[i + 1]] + 0.0722 * LSTAR[px[i + 2]];
      const L = Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
      row += L; row2 += L * L;
      S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row;
      S2[(y + 1) * (W + 1) + x + 1] = S2[y * (W + 1) + x + 1] + row2;
    }
  }
  const r = (CALM.window - 1) / 2;
  return (zone) => {
    let sum = 0, n = 0;
    for (let y = Math.max(0, Math.floor(zone.y)); y < Math.min(H, Math.ceil(zone.y + zone.h)); y++)
      for (let x = Math.max(0, Math.floor(zone.x)); x < Math.min(W, Math.ceil(zone.x + zone.w)); x++) {
        const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
        const k = (x1 - x0) * (y1 - y0);
        const at = (T) => T[y1 * (W + 1) + x1] - T[y0 * (W + 1) + x1] - T[y1 * (W + 1) + x0] + T[y0 * (W + 1) + x0];
        const m = at(S) / k;
        sum += Math.sqrt(Math.max(0, at(S2) / k - m * m));
        n++;
      }
    return n ? sum / n : 0;
  };
}
// The text's own extent: the union of its text's boxes, a block's box would
// span the frame. A subtitle line counts the lit box's 6 px sides.
function textExtent(node, sides = 0) {
  let r = null;
  const add = (q) => {
    if (!q.width) return;
    r = r ? { l: Math.min(r.l, q.left - sides), t: Math.min(r.t, q.top), r: Math.max(r.r, q.right + sides), b: Math.max(r.b, q.bottom) } : { l: q.left - sides, t: q.top, r: q.right + sides, b: q.bottom };
  };
  if (node.classList.contains("vf-pill")) add(node.getBoundingClientRect());
  else {
    const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) {
      if (!walk.currentNode.nodeValue.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(walk.currentNode);
      add(range.getBoundingClientRect());
    }
  }
  return r;
}
// Each small-text block of a card: [block, extent in frame pixels]. The
// subtitle zone covers every chunk of the card, so it does not move while
// the voice speaks.
function smallText(parts, subtitles) {
  const out = [];
  const layer = parts.layer;
  if (parts.closing) {
    for (const [sel, block] of [[".vf-close > .vf-sigline", "line"], [".vf-close > .vf-sent", "invitation"], [".vf-close > .vf-pill", "pill"], [".vf-close > .vf-next", "next"], [".vf-close-foot .vf-cred", "ending-credit"]]) {
      const n = layer.querySelector(sel);
      const r = n && textExtent(n);
      if (r) out.push([block, r]);
    }
    return out;
  }
  let sub = null;
  for (const lines of subtitles) {
    drawSubtitle({ lines, opacity: 1, highlight: null });
    for (const t of document.querySelectorAll("#subtitles .sub-text")) {
      const q = t.getBoundingClientRect();
      if (!q.width) continue;
      const r = { l: q.left - 6, t: q.top, r: q.right + 6, b: q.bottom };
      sub = sub ? { l: Math.min(sub.l, r.l), t: Math.min(sub.t, r.t), r: Math.max(sub.r, r.r), b: Math.max(sub.b, r.b) } : r;
    }
  }
  drawSubtitle(null);
  if (sub) out.push(["subtitles", sub]);
  const foot = layer.querySelector(".vf-foot");
  const r = foot && textExtent(foot);
  if (r) out.push(["foot", r]);
  return out;
}
// The picture as the card's first frame shows it, alone, into a canvas.
function pictureCanvas(parts, zoom, blur) {
  const img = parts.photo, s = img.style;
  const w = parseFloat(s.width), h = parseFloat(s.height), left = parseFloat(s.left), top = parseFloat(s.top);
  const [fx, fy] = parts.focus;
  const ox = left + fx * w, oy = top + fy * h;
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (blur) ctx.filter = "blur(" + blur + "px)";
  ctx.drawImage(img, ox - fx * w * zoom, oy - fy * h * zoom, w * zoom, h * zoom);
  return canvas;
}
const round2 = (n) => Math.round(n * 100) / 100;
function calmZones(parts, subtitles, zoom) {
  if (!parts.photo || parts.photo.tagName !== "IMG" || parts.doc || !parts.photo.naturalWidth) return null;
  const off = parts.spec.image && parts.spec.image.calm === false;
  const before = localContrast(pictureCanvas(parts, zoom, 0));
  const after = localContrast(pictureCanvas(parts, zoom, CALM.blur));
  const zones = smallText(parts, subtitles).map(([block, r]) => {
    const x = Math.max(0, r.l - CALM.pad), y = r.t - CALM.pad, x1 = Math.min(1080, r.r + CALM.pad), y1 = r.b + CALM.pad;
    const zone = { block, x: round2(x), y: round2(y), w: round2(x1 - x), h: round2(y1 - y) };
    return { ...zone, before: round2(before(zone)), after: round2(after(zone)) };
  });
  if (!zones.length) return null;
  const measure = round2(zones.reduce((n, z) => n + z.before, 0) / zones.length);
  const applied = !off && measure >= CALM.busy;
  parts.calmImages = [];
  if (applied)
    for (const z of zones) {
      const x0 = Math.max(0, z.x - CALM.feather), y0 = z.y - CALM.feather, x1 = Math.min(1080, z.x + z.w + CALM.feather), y1 = z.y + z.h + CALM.feather;
      const d = el("div", "vf-calm");
      Object.assign(d.style, { left: x0 + "px", top: y0 + "px", width: x1 - x0 + "px", height: y1 - y0 + "px" });
      const f = CALM.feather;
      d.style.webkitMaskImage = d.style.maskImage = "linear-gradient(to right, transparent, #000 " + f + "px, #000 calc(100% - " + f + "px), transparent), linear-gradient(to bottom, transparent, #000 " + f + "px, #000 calc(100% - " + f + "px), transparent)";
      const copy = parts.photo.cloneNode();
      copy.style.left = parseFloat(parts.photo.style.left) - x0 + "px";
      copy.style.top = parseFloat(parts.photo.style.top) - y0 + "px";
      d.append(copy);
      parts.pic.append(d);
      parts.calmImages.push(copy);
    }
  return { card: parts.spec.id, measure, applied, ...(off && { off: true }), zones };
}

// Long dates: the largest size that holds on one line in 960 px, measured
// on the drawn glyphs; else two balanced lines at 104/100.
function setDate(parts) {
  const d = parts.date;
  const ink = () => { const r = document.createRange(); r.selectNodeContents(d); return r.getBoundingClientRect().width; };
  let i = 0;
  for (; i < DATE_STEPS.length; i++) {
    d.style.fontSize = DATE_STEPS[i][0] + "px";
    d.style.lineHeight = DATE_STEPS[i][1] + "px";
    if (ink() <= 960) break;
  }
  if (i === DATE_STEPS.length) {
    i = DATE_STEPS.length - 1;
    d.style.whiteSpace = "normal";
    d.style.textWrap = "balance";
  }
  parts.dateSize = DATE_STEPS[i][0];
  parts.dateLines = Math.round(d.getBoundingClientRect().height / DATE_STEPS[i][1]);
}

window.setup = async ({ tokens, cards, logo, demo, maps, subtitles: cardLines, zooms }) => {
  await EthniCards.installTokens(tokens, "/design/");
  logoUrl = resolveAsset(logo);
  const frame = document.getElementById("frame");
  frame.setAttribute("data-theme", cards[0].theme || "nuit");
  if (maps) sat = await satellite(maps.bounds);
  for (const [i, spec] of cards.entries()) {
    const parts = buildLayer(spec, maps && maps.views[i]);
    if (parts.view) paintImagery(parts.map._canvas, parts.view.camera);
    frame.append(parts.layer);
    layers.push(parts);
  }
  if (maps && maps.sequence) {
    // Each still view, and since 1.11.0 the view after each move inside a card.
    for (const v of Object.values(maps.sequence.views))
      for (const camera of v.stops || [v.camera]) {
        const key = cameraKey(camera);
        if (viewImagery.has(key)) continue;
        const still = document.createElement("canvas");
        still.width = 1080; still.height = 1920;
        paintImagery(still, camera);
        viewImagery.set(key, still);
      }
    maps.sequence.runs.forEach((_, r) => runs.push(runLayer(maps.sequence, r)));
    // 1.11.0: the drawings, decoded before the first frame.
    const decoding = [];
    for (const node of runs.filter((n) => n.animated))
      for (const kind of maps.sequence.illustrations || []) {
        node.pool[kind] = [];
        for (let k = 0; k < ${MARKS.maxDrawings}; k++) {
          const img = ringed(el("img", "sm-ill"), 4);
          img.alt = "";
          img.decoding = "sync";
          img.style.display = "none";
          img.src = "/design/assets/Illustrations/" + kind + ".svg";
          node.ills.append(img);
          node.pool[kind].push(img);
          node.images.push(img);
          decoding.push(img.decode().catch(() => { throw new Error("Drawing not loaded: " + kind); }));
        }
      }
    await Promise.all(decoding);
    for (const kind of maps.sequence.illustrations || []) {
      const box = el("div");
      box.style.cssText = "position:absolute;left:-4000px;top:0";
      box.innerHTML = await (await fetch("/design/assets/Illustrations/" + kind + ".svg")).text();
      document.body.append(box);
      const b = box.querySelector("svg").getBBox();
      drawingInk[kind] = { x: b.x, y: b.y + 12, w: b.width, h: b.height };
      box.remove();
    }
  }
  // The band and the content cards' signature are drawn once: they never
  // fade, whatever the card change.
  const sr = EthniCards.seriesOf(cards[0]);
  const band = el("div", "vf-band oi", esc(fr(sr.name)) + '<span class="vf-sep"> · </span><span class="vf-ep">n°\\u00a0' + sr.episode + "</span>");
  frame.append(band);
  const sign = signature();
  sign.id = "signature";
  frame.append(sign);
  // 1.12.0: their Parchemin inking, drawn once in the same places.
  if (cards.some((c) => c.ground === "parchment")) {
    const bandPa = band.cloneNode(true);
    bandPa.id = "band-pa";
    const signPa = signature();
    signPa.id = "signature-pa";
    for (const n of [bandPa, signPa]) {
      n.classList.add("vf-pa");
      n.dataset.theme = "parchemin";
      n.style.opacity = "0";
    }
    signPa.style.cssText += ";position:absolute;left:60px;top:1836px;height:48px;z-index:3";
    frame.append(bandPa, signPa);
  }
  const subtitles = el("div");
  subtitles.id = "subtitles";
  frame.append(subtitles);
  if (demo) frame.append(el("div", "vf-demo", esc(fr(demo))));
  ringFilters();
  ringText(frame);
  const images = [...frame.querySelectorAll(".vf-pic img, .pd-img")];
  // 1.12.0: the ground's grain, decoded before the first frame.
  if (layers.some((p) => p.pa)) {
    const grain = new Image();
    grain.src = "/repo/social/series-idents/assets/grain.png";
    images.push(grain);
  }
  await Promise.all(images.map((i) => i.decode().catch(() => null)));
  const broken = images.filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src"));
  // 1.8.0: a document is framed from its card's image.w and h.
  for (const parts of layers) {
    const img = parts.doc && parts.doc.sharp.firstChild;
    if (img && img.naturalWidth && (img.naturalWidth !== parts.spec.image.w || img.naturalHeight !== parts.spec.image.h))
      broken.push(img.getAttribute("src") + " is " + img.naturalWidth + " × " + img.naturalHeight + ", not the card's " + parts.spec.image.w + " × " + parts.spec.image.h);
  }
  const logoImg = new Image();
  logoImg.src = logoUrl;
  await logoImg.decode().catch(() => broken.push(logoUrl));
  await document.fonts.ready;
  await Promise.all(layers.filter((p) => p.ident).map(identReady));
  for (const [i, parts] of layers.entries()) {
    parts.layer.style.display = "block";
    if (parts.photo && parts.photo.naturalWidth) placeImage(parts);
    if (parts.date) setDate(parts);
    if (parts.formula) setFormula(parts);
    if (parts.paFormula) setMovingFormula(parts);
    // 1.10.0: the calm zones, once the picture is placed and the text set.
    parts.calm = calmZones(parts, (cardLines && cardLines[i]) || [], (zooms && zooms[i]) || 1);
    parts.layer.style.display = "none";
  }
  const fonts = ["400 40px Anton", "800 40px 'Nunito Sans'", "600 40px Fraunces"].map((f) => document.fonts.check(f));
  return { broken, fonts, version: EthniCards.version, calm: layers.map((p) => p.calm).filter(Boolean) };
};

// Boxes of the text drawn: the ink's width and the line boxes' height, as the
// 0.4.0 page measures subtitles (a glyph's content area overhangs its line).
function inkBox(node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  const ink = range.getBoundingClientRect(), block = node.getBoundingClientRect();
  return { x: ink.left, w: ink.width, y: block.top, h: block.height };
}
const rect = (node) => { const r = node.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
const shown = (node) => +getComputedStyle(node).opacity > 0;

function frameBoxes(frame, state) {
  const boxes = [];
  const add = (node, kind, extra) => {
    if (!node.textContent.trim() || !node.getClientRects().length) return;
    boxes.push({ id: node.textContent.trim().slice(0, 40), kind, ...inkBox(node), ...extra });
  };
  add(frame.querySelector(".vf-band"), "band");
  const sign = document.getElementById("signature");
  if (shown(sign)) boxes.push({ id: "signature", kind: "signature", ...rect(sign) });
  for (const l of state.layers) {
    const parts = layers[l.card];
    if (l.opacity > 0 && parts.scale) boxes.push({ id: parts.spec.id, kind: "image", ...rect(parts.photo), scale: +(parts.scale * l.zoom).toFixed(3) });
    if (l.opacity > 0 && parts.doc) boxes.push({ id: parts.spec.id, kind: "document", passage: rect(parts.doc.passage), sharp: rect(parts.doc.band) });
    if (l.opacity > 0 && parts.view) {
      // The subject and the names zoom with the map around (540, 1010).
      const s = parts.view.subject, z = l.zoom, cy = parts.view.camera.centreY;
      boxes.push({ id: parts.spec.id, kind: "map-subject", x: 540 + (s.x - 540) * z, y: cy + (s.y - cy) * z, w: s.w * z, h: s.h * z });
      parts.map.querySelectorAll(".sm-name-box").forEach((n) => boxes.push({ id: n.textContent, kind: "map-name", ...rect(n) }));
    }
    if (l.opacity > 0 && l.map) {
      // 1.5.0: the run's map, hosted by this layer. The subject is checked
      // on still views; a stack is one name box.
      boxes.push({ id: parts.spec.id, kind: "image", x: 0, y: 0, w: 1080, h: 1920, scale: +(l.map.scale * l.zoom).toFixed(3) });
      const s = l.map.subject, z = l.zoom, cy = l.map.camera.centreY;
      if (s) boxes.push({ id: parts.spec.id, kind: "map-subject", x: 540 + (s.x - 540) * z, y: cy + (s.y - cy) * z, w: s.w * z, h: s.h * z });
      runs[l.map.run].names.querySelectorAll(".sm-name-box").forEach((n) => boxes.push({ id: n.textContent, kind: "map-name", ...rect(n), ink: getComputedStyle(n).color, ...(l.map.animated && { animated: true, moving: l.map.moving, opacity: +n.style.opacity }) }));
      // 1.11.0: every text and drawing on the map, and the arrows' heads.
      if (l.map.animated) {
        const node = runs[l.map.run];
        const flags = { animated: true, moving: l.map.moving };
        node.marks.querySelectorAll("[data-mark]").forEach((n) => {
          if (!(+n.style.opacity > 0)) return;
          const r = rect(n);
          boxes.push({ id: n.textContent, kind: n.dataset.mark === "word" ? "map-word" : "map-name", ...r, ...flags, opacity: +n.style.opacity, ...(n.dataset.leaving && { leaving: true }), ...(n.dataset.of !== undefined && { of: "drawing " + n.dataset.of }) });
        });
        node.images.forEach((n) => {
          if (n.style.display === "none" || !(+n.style.opacity > 0)) return;
          const r = rect(n), k = r.w / 160, ink = drawingInk[n.dataset.kind];
          boxes.push({ id: n.dataset.kind, kind: "map-drawing", x: r.x + ink.x * k, y: r.y + ink.y * k, w: ink.w * k, h: ink.h * k, ...flags, opacity: +n.style.opacity, of: "drawing " + n.dataset.of });
        });
        node.arrows.querySelectorAll("[data-head][data-drawn='1']").forEach((n) => boxes.push({ id: n.dataset.head, kind: "map-head", ...rect(n), ...flags, opacity: +n.parentNode.getAttribute("opacity") }));
      }
    }
    if (!(l.text > 0)) continue;
    const layer = parts.layer;
    // The chapter card's texts count once they have entered.
    if (parts.chapter)
      for (const n of [parts.chapter.count, parts.chapter.title])
        if (+n.style.opacity > 0) add(n, n.dataset.kind, { card: l.card });
    layer.querySelectorAll(".vf-head > *").forEach((n) => {
      // 1.7.0: readings and figures flow below the head, down to y 1290.
      if (n.matches(".vf-list, .vf-figs, .vf-week")) return [...n.children].forEach((c) => add(c, "items", { card: l.card }));
      // 1.8.0: side by side; its note holds on two lines.
      if (n.matches(".vf-sbs")) return [...n.children].forEach((c) => add(c, "items", { card: l.card, ...(c === parts.sbs.note && { lines: Math.round(c.getBoundingClientRect().height / 36), maxLines: 2 }) }));
      add(n, n.dataset.kind || "head", { card: l.card, ...(n === parts.date && { date: { size: parts.dateSize, lines: parts.dateLines } }) });
    });
    layer.querySelectorAll(".vf-attr > *").forEach((n) => add(n, "attribution", { card: l.card }));
    // 1.12.0: every text and drawing of a parchment card, while it shows.
    if (parts.paBox) {
      const showing = (n) => n.style.visibility !== "hidden" && +getComputedStyle(n).opacity > 0 && +getComputedStyle(n.closest(".pw-row") || n).opacity > 0;
      parts.paBox.querySelectorAll(".oi").forEach((n) => { if (!n.parentElement.closest(".oi") && showing(n)) add(n, "parchment", { card: l.card }); });
      parts.paBox.querySelectorAll(".pd-img").forEach((n) => { if (showing(n)) boxes.push({ id: n.getAttribute("src"), kind: "parchment", ...rect(n), card: l.card }); });
    }
    // 1.8.0: the formula's lines of every step on screen.
    if (parts.formula)
      parts.formula.steps.forEach((st, k) => {
        if (!(l.steps ? l.steps[k] > 0 : k === parts.formula.steps.length - 1)) return;
        [...st.children].forEach((n) => add(n, "formula", { card: l.card, ...(n.dataset.size && { size: +n.dataset.size }) }));
      });
    layer.querySelectorAll(".vf-close > *").forEach((n) => {
      if (n.classList.contains("vf-pill")) boxes.push({ id: "pill", kind: "pill", ...rect(n) });
      else add(n, "ending");
    });
    // A map card's foot may start at y 1600 (1.4.1).
    layer.querySelectorAll(".vf-foot [data-kind]").forEach((n) => add(n, n.dataset.kind, parts.view || parts.seqView ? { map: true } : {}));
    layer.querySelectorAll(".vf-close-foot .vf-cred").forEach((n) => add(n, "ending-credit"));
    layer.querySelectorAll(".vf-close-foot .vf-sign").forEach((n) => boxes.push({ id: "signature", kind: "signature", ...rect(n) }));
    layer.querySelectorAll(".vf-slot-text > *").forEach((n) => add(n, "slot"));
  }
  frame.querySelectorAll("#subtitles .sub-line").forEach((row, i) => {
    const t = row.firstChild.getBoundingClientRect(), r = row.getBoundingClientRect();
    boxes.push({ id: "subtitle line " + (i + 1), kind: "subtitle", x: t.left, w: t.width, y: r.top, h: r.height });
  });
  const tape = frame.querySelector(".vf-demo");
  if (tape) boxes.push({ id: "tape", kind: "tape", ...rect(tape) });
  return boxes;
}

// Anything that paints a background over the image, besides the lit word,
// the « image à trouver » slot, a map's place dots and the demo tape.
function backgrounds(frame) {
  // A parchment card is its own ground, not a picture (1.12.0).
  const allowed = (n) => n.closest(".lit, .vf-slot, .vf-demo, .vf-key, .sm-dot, .vf-doc, .vf-pa") || n.classList.contains("vf-pic");
  return [...frame.querySelectorAll("*")]
    .filter((n) => n.getClientRects().length && !allowed(n))
    .filter((n) => {
      const s = getComputedStyle(n);
      return s.backgroundImage !== "none" || !/rgba\\(\\d+, \\d+, \\d+, 0\\)|transparent/.test(s.backgroundColor);
    })
    .map((n) => n.className || n.tagName);
}

// 1.9.0: the text on the image as drawn. Each outermost block (one that no
// text on the image contains) with the outline its letters carry and its
// filter; and any text on the image still casting a text-shadow, map names
// left out (they keep their own halo).
const TEXT_ON_IMAGE = ".oi, .sub-line";
const outlineOf = (n) => parseFloat(getComputedStyle(n.matches(".sub-line") ? n.firstElementChild : n).webkitTextStrokeWidth);
function legibility(frame) {
  const drawnText = [...frame.querySelectorAll(TEXT_ON_IMAGE)].filter((n) => n.getClientRects().length);
  const blocks = drawnText
    .filter((n) => !n.parentElement.closest(TEXT_ON_IMAGE))
    .map((n) => ({ id: n.textContent.trim().slice(0, 40), cls: n.className, tag: n.tagName, parent: n.parentElement.className, outline: outlineOf(n), filter: getComputedStyle(n).filter, size: getComputedStyle(n).fontSize, color: getComputedStyle(n).color }));
  const shadowed = [...frame.querySelectorAll(".oi, .oi *, .sub-line, .sub-line *")]
    .filter((n) => n.getClientRects().length && getComputedStyle(n).textShadow !== "none")
    .map((n) => n.className || n.tagName);
  return { blocks, shadowed };
}

// One subtitle chunk, as the 0.4.0 page draws it: units always wrapped, lit
// or not, so the highlight changes paint only, never layout.
function drawSubtitle(subtitle) {
  const band = document.getElementById("subtitles");
  band.replaceChildren();
  if (!subtitle || subtitle.opacity <= 0) return;
  band.style.opacity = subtitle.opacity;
  // 1.12.0: on a parchment card, the Parchemin ink.
  band.classList.toggle("sub-pa", !!subtitle.parchment);
  if (subtitle.parchment) band.dataset.theme = "parchemin";
  else delete band.dataset.theme;
  for (const line of subtitle.lines) {
    const row = el("div", "sub-line"), text = el("span", "sub-text");
    let unitNode = null;
    for (const run of line) {
      let node;
      const words = fr(run.text);
      if (run.arabic) {
        node = el("bdi"); node.textContent = words; node.lang = "ar"; node.dir = "rtl";
        node.style.cssText = "font-family:'Noto Sans Arabic',sans-serif;font-style:normal;font-weight:600";
      } else if (run.italic) { node = el("i"); node.textContent = words; }
      else node = document.createTextNode(words);
      if (run.unit === undefined) { unitNode = null; text.append(node); continue; }
      if (!unitNode || unitNode.dataset.unit !== String(run.unit)) {
        unitNode = el("span");
        unitNode.dataset.unit = run.unit;
        if (run.unit === subtitle.highlight) unitNode.className = "lit";
        text.append(unitNode);
      }
      unitNode.append(node);
    }
    row.append(text);
    band.append(row);
  }
}

// 1.12.0: a parchment card on one frame, from its layer's state.
function drawParchment(parts, l) {
  const g = parts.ground;
  g.grain.style.transform = "translate(" + l.ground.grain[0] + "px," + l.ground.grain[1] + "px)";
  g.glow.style.transform = "translate(" + l.ground.glow[0] + "px," + l.ground.glow[1] + "px)";
  if (parts.paWeek)
    parts.paWeek.forEach((r, k) => {
      r.row.style.opacity = l.week.rows[k].opacity;
      r.row.style.transform = "translateY(" + l.week.rows[k].rise + "px)";
      r.band.style.opacity = l.week.lit[k];
    });
  if (parts.paFormula) drawMovingFormula(parts, l.formula);
  if (parts.paDrawings)
    parts.paDrawings.forEach((d, k) => {
      const s = l.drawings[k];
      d.img.style.opacity = s.opacity;
      d.img.style.transform = "translateY(" + s.rise + "px)";
      d.name.style.opacity = s.name;
      d.quality.style.opacity = s.quality;
    });
  if (parts.paDate) {
    for (const n of [parts.paDate, parts.paLabel]) if (n) n.style.opacity = l.date.opacity;
    parts.paDate.style.transform = "scale(" + l.date.scale + ")";
  }
  if (parts.paQuote) {
    parts.paQuote.lines.forEach((n, k) => (n.style.opacity = l.quote.lines[k]));
    parts.paQuote.box.firstChild.style.opacity = l.quote.lines[0];
    if (parts.paQuote.source) parts.paQuote.source.style.opacity = l.quote.source;
    parts.paQuote.marks.forEach((m, k) => (m.lastChild.style.transform = "scaleX(" + l.quote.marks[k] + ")"));
  }
  if (parts.paWords)
    parts.paWords.forEach((n, k) => {
      n.style.opacity = l.words[k].opacity;
      n.style.transform = "translateY(" + l.words[k].rise + "px)";
    });
}

// What a parchment card drew, for the checks of the handoff.
function parchmentReport(parts, l) {
  const op = (n) => +getComputedStyle(n).opacity;
  const f = parts.paFormula;
  return {
    id: parts.spec.id,
    picture: +parts.pic.style.opacity,
    ground: { grain: parts.ground.grain.style.transform, glow: parts.ground.glow.style.transform },
    head: rect(parts.layer.querySelector(".vf-head")),
    rows: (parts.paWeek || []).map((r) => ({ ...rect(r.row), opacity: op(r.row), band: op(r.band), cells: r.cells.map((c) => inkBox(c)) })),
    pieces: f ? f.lines.map((line) => Object.entries(line.spans).filter(([, s]) => s.style.visibility === "visible" && op(s) > 0).map(([key, s]) => ({ key, text: s.textContent, ...rect(s), opacity: op(s), scale: +(s.style.transform.match(/scale\\(([^)]+)\\)/) || [0, 1])[1] }))) : [],
    drawings: (parts.paDrawings || []).map((d) => ({ ...rect(d.img), opacity: op(d.img), complete: d.img.complete && d.img.naturalWidth > 0, name: inkBox(d.name), quality: inkBox(d.quality) })),
    attribution: parts.attribution ? rect(parts.attribution) : null,
    marks: parts.paQuote ? parts.paQuote.marks.map((m) => ({ words: inkBox(m.firstChild), underline: rect(m.lastChild) })) : [],
    quote: parts.paQuote ? rect(parts.paQuote.box) : null,
    words: (parts.paWords || []).map(inkBox),
    texts: [...parts.layer.querySelectorAll(".vf-pa .oi, .vf-pa.oi")].filter((n) => n.getClientRects().length).map((n) => ({ text: n.textContent.trim().slice(0, 30), stroke: getComputedStyle(n).webkitTextStrokeWidth, filter: getComputedStyle(n).filter, color: getComputedStyle(n).color })),
  };
}

window.drawFrame = (state) => {
  const frame = document.getElementById("frame");
  const paintsBefore = imageryPaints;
  // A run's map is drawn once, in the picture of its most opaque layer: the
  // outgoing card between two cards of a run, the incoming one on a return.
  const hosts = new Map();
  for (const l of state.layers)
    if (l.map && (!hosts.has(l.map.run) || l.opacity > hosts.get(l.map.run).opacity)) hosts.set(l.map.run, l);
  for (const [r, l] of hosts) {
    (l.map.animated ? drawAnimatedRun : drawRun)(runs[r], l.map);
    if (runs[r].wrap.parentNode !== layers[l.card].pic) layers[l.card].pic.append(runs[r].wrap);
  }
  layers.forEach((parts, i) => {
    const l = state.layers.find((x) => x.card === i);
    parts.layer.style.display = l ? "block" : "none";
    if (!l) return;
    parts.layer.style.zIndex = state.layers.indexOf(l) + 1;
    parts.pic.style.opacity = l.opacity;
    for (const t of parts.text) t.style.opacity = l.text;
    if (parts.chapter && l.chapter) drawChapter(parts.chapter, l.chapter.t, l.text);
    // A sequence card's key items follow their areas.
    if (l.map) parts.layer.querySelectorAll(".vf-key[data-file]").forEach((k) => (k.style.opacity = l.map.keys[k.dataset.file] ?? 0));
    // 1.11.0: the opener's credit, the imagery alone during the globe.
    if (parts.credits) parts.credits.forEach((c) => (c.style.display = c.dataset.credit === ((l.map && l.map.credit) || "map") ? "" : "none"));
    // 1.7.0: items and the quoted person enter on their word, inside the
    // card's own text fade.
    if (parts.items) parts.items.forEach((n, k) => (n.style.opacity = l.items ? l.items[k] : 1));
    if (parts.attribution) parts.attribution.style.opacity = l.text * (l.attribution ?? 1);
    // 1.8.0: the underline, the formula's steps, the rows and the days.
    if (parts.doc) {
      parts.doc.marks.forEach((m) => (m.style.opacity = l.mark ?? 1));
      parts.doc.blurred.style.transform = "scale(" + l.zoom + ")";
    }
    if (parts.formula) parts.formula.steps.forEach((st, k) => (st.style.opacity = l.steps ? l.steps[k] : k === parts.formula.steps.length - 1 ? 1 : 0));
    if (parts.sbs) {
      parts.sbs.rows.forEach((cells, k) => cells.forEach((c) => (c.style.opacity = l.rows ? l.rows[k] : 1)));
      parts.sbs.days.forEach((d) => (d.style.opacity = l.days ?? 1));
      if (parts.sbs.note) parts.sbs.note.style.opacity = l.note ?? 1;
    }
    if (parts.week) parts.week.rows.forEach((cells, k) => cells.forEach((c) => (c.style.opacity = l.rows ? l.rows[k] : 1)));
    if (parts.pa) drawParchment(parts, l);
    if (parts.photo) {
      if (parts.view) parts.photo.style.transformOrigin = "540px " + parts.view.camera.centreY + "px";
      parts.photo.style.transform = "scale(" + l.zoom + ")";
      // 1.10.0: the calm zones' copies zoom with the picture.
      (parts.calmImages || []).forEach((c) => (c.style.transform = parts.photo.style.transform));
    }
  });
  // The content cards' signature stays whole, except when the closing card,
  // which has its own centred signature, comes in.
  const closing = state.layers.find((l) => layers[l.card].closing);
  const content = state.layers.find((l) => !layers[l.card].closing);
  document.getElementById("signature").style.opacity = !content ? 0 : closing ? content.text : 1;
  // An ident draws its own frame; the band and the signature leave the
  // parchment to it, fading with it.
  const idents = state.layers.filter((l) => l.ident);
  for (const l of idents) layers[l.card].ident.frame.contentWindow.render(l.ident.t);
  // The chapter card, too, is text alone: the band and the signature fade
  // out under it as under an ident.
  const chapters = state.layers.filter((l) => l.chapter);
  const identOn = Math.max(0, ...idents.map((l) => l.opacity), ...chapters.map((l) => l.opacity));
  // 1.12.0: the band and the signature in their two inkings, cross-faded in
  // place during a change into or out of a parchment card.
  const pw = state.parchment || 0;
  frame.querySelector(".vf-band").style.opacity = (1 - identOn) * (1 - pw);
  const sig = document.getElementById("signature");
  const sigOn = +sig.style.opacity * (1 - identOn);
  sig.style.opacity = sigOn * (1 - pw);
  const bandPa = document.getElementById("band-pa");
  if (bandPa) {
    bandPa.style.opacity = (1 - identOn) * pw;
    document.getElementById("signature-pa").style.opacity = sigOn * pw;
  }
  drawSubtitle(state.subtitle);
  const visible = state.layers.map((l) => layers[l.card]);
  const maps = visible.filter((p) => p.map).map((p) => {
    const r = p.map.getBoundingClientRect();
    return { id: p.spec.id, camera: p.view.camera, spanKm: p.view.spanKm, capped: p.view.capped, x: r.left, y: r.top, w: r.width, h: r.height };
  });
  for (const [r, l] of hosts)
    maps.push({ id: layers[l.card].spec.id, run: r, camera: l.map.camera, moving: l.map.moving, spanKm: (1080 / l.map.camera.radius) * 6371 });
  const accent = getComputedStyle(frame.querySelector(".vf-band .vf-ep")).color;
  const documents = state.layers.filter((l) => layers[l.card].doc && l.opacity > 0).map((l) => {
    const d = layers[l.card].doc;
    return {
      id: layers[l.card].spec.id, blur: getComputedStyle(d.blurred).filter, scale: d.frame.scale, zoom: l.zoom, edge: d.frame.edge,
      page: rect(d.sharp), passage: rect(d.passage), sharp: rect(d.band), accent,
      marks: d.marks.map((m) => ({ ...rect(m), opacity: +getComputedStyle(m).opacity, color: getComputedStyle(m).backgroundColor })),
    };
  });
  const pictures = state.layers.filter((l) => l.opacity > 0).map((l) => ({ id: layers[l.card].spec.id, ...rect(layers[l.card].pic.firstElementChild || layers[l.card].pic) }));
  return {
    boxes: frameBoxes(frame, state),
    text: frame.innerText,
    lit: frame.querySelectorAll("#subtitles .lit").length,
    litBoxes: [...frame.querySelectorAll("#subtitles .lit")].map(rect),
    legibility: legibility(frame),
    // 1.10.0: the calm record of each card on screen, and the zones drawn.
    calm: state.layers.map((l) => layers[l.card].calm).filter(Boolean),
    calmDrawn: [...frame.querySelectorAll(".vf-calm")].filter((n) => n.getClientRects().length && +getComputedStyle(n.parentElement).opacity > 0).length,
    maps,
    pictures,
    backgrounds: backgrounds(frame),
    documents,
    imageryPaints: imageryPaints - paintsBefore,
    // 1.7.0: a hyphenated word drawn over two lines.
    hyphenBreaks: [...frame.querySelectorAll(".vf-nowrap")].filter((n) => n.getClientRects().length > 1).map((n) => n.textContent),
    // The ident on top, its clock, its opacity and the words it shows.
    ident: idents.length ? (() => {
      const top = idents[idents.length - 1];
      return { clip: top.ident.clip, t: top.ident.t, opacity: top.opacity, text: layers[top.card].ident.frame.contentDocument.body.innerText };
    })() : null,
    chrome: +frame.querySelector(".vf-band").style.opacity,
    // 1.12.0: the parchment cards drawn, and the band and signature inkings.
    parchment: state.layers.filter((l) => layers[l.card].pa).map((l) => parchmentReport(layers[l.card], l)),
    inkings: document.getElementById("band-pa") ? ["vf-band", "band-pa", "signature", "signature-pa"].map((id) => {
      const n = id === "vf-band" ? frame.querySelector(".vf-band") : document.getElementById(id);
      const t = n.matches(".vf-band") ? n : n.querySelector("b");
      return { id, ...rect(n), opacity: +n.style.opacity, color: getComputedStyle(t).color, stroke: getComputedStyle(t).webkitTextStrokeWidth, filter: getComputedStyle(t).filter };
    }) : null,
    subtitleInk: (() => {
      const t = frame.querySelector("#subtitles .sub-text");
      const lit = frame.querySelector("#subtitles .lit");
      return t ? { color: getComputedStyle(t).color, stroke: getComputedStyle(t).webkitTextStrokeWidth, filter: getComputedStyle(t.parentElement).filter, lit: lit && { background: getComputedStyle(lit).backgroundColor, color: getComputedStyle(lit).color } } : null;
    })(),
    // 1.11.0: what the animated map drew, read back from the page.
    animated: [...hosts].filter(([, l]) => l.map.animated).map(([r]) => {
      const node = runs[r];
      return {
        areas: Object.entries(node.areas).map(([file, a]) => ({
          file,
          layers: Object.entries(a.layers).map(([ink, L]) => ({
            ink, opacity: +L.g.getAttribute("opacity"),
            fill: +L.fill.getAttribute(a.uncertain ? "opacity" : "fill-opacity"),
            edge: +L.edge.getAttribute("stroke-width"), edgeOpacity: +L.edge.getAttribute("stroke-opacity"),
            keyline: +L.keyline.getAttribute("stroke-width"),
          })).filter((l) => l.opacity > 0),
        })).filter((a) => a.layers.length),
        heads: [...node.arrows.querySelectorAll("[data-head]")].map((h) => ({ id: h.dataset.head, ...rect(h) })),
        drawings: node.images.filter((i) => i.style.display !== "none").map((i) => ({ kind: i.dataset.kind, filter: getComputedStyle(i).filter, complete: i.complete && i.naturalWidth > 0, ...rect(i) })),
        texts: [...node.names.children, ...node.marks.querySelectorAll("[data-mark]")].map((n) => ({ text: n.textContent, mark: n.dataset.mark || "name", opacity: +n.style.opacity, filter: getComputedStyle(n).filter, ...rect(n) })),
      };
    }),
  };
};
</script></body></html>`;
