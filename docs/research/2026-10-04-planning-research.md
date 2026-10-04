# Research notes (2026-10-04)

Raw findings from the planning research workflows, each checked by an adversarial reviewer. Corrections from the reviewer override the finding.

## store-policy

- (a) Rejection risk is LOW to MODERATE if the app is framed well. Apple 1.1.4 bans "overtly sexual or pornographic material" with "explicit descriptions or displays of sexual organs or activities". Clothed portraits plus a slang vote are nowhere near that line. Google Play bans "sexual nudity, or sexually suggestive poses" and grants an exemption for educational, documentary, scientific or artistic content (EDSA). The real Apple risk is 1.1 ("in exceptionally poor taste... creepy") and 1.1.1 (discriminatory content). Hominin reconstructions with exaggerated "primitive" features plus a fuckability vote can read as racial caricature. That subjective reviewer judgement is the most likely reason for a rejection. Apple 1.2 names "objectification of real people (e.g. 'hot-or-not' voting)" as banned, but only for user-generated content. This game has no user-generated content and no real people, so 1.2 does not apply. Do not add a camera or photo-upload feature later, since that would bring it into scope.
- Precedent: smash-or-pass apps are live on both stores. On Apple, "Smash Or Pass: Group Games" (id6736897283) is a pass-the-phone group game with dirty scenarios, free with in-app purchases, rated 18+ and holding 4.5 stars. On Google Play: "Smash or Pass Anime Game" (100K+ downloads, 4.7 stars), "Smash or Pass Celebrity" (real celebrities, 5K+) and a YouTuber variant. I could not fetch the Google content-rating labels (the Play pages would not load), so those ratings are unconfirmed.
- (b) Apple ratings: the new tiers are live. They are 4+, 9+, 13+, 16+ and 18+, and 12+ and 17+ were removed. So the spec's "17+" no longer exists on iOS. Every app had to answer the new questionnaire by 31 Jan 2026. Social-media questions became required for new apps and updates from Sept 2026; answer "no". Apple's definitions map like this: "Frequent mature or suggestive themes" (innuendo, suggestive imagery) gives 16+. "Infrequent sexual content" gives 13+. "Frequent sexual content or nudity" gives 18+. An honest answer for this game is frequent mature or suggestive themes, which is likely 16+. The developer can choose 18+ to match the 17+ intent, and the precedent app sits at 18+.
- (b) Google Play: the IARC questionnaire produces ESRB, PEGI, USK, ClassInd, GRAC and ACB ratings automatically. Sexual innuendo or suggestive themes with no nudity usually lands at ESRB Teen or PEGI 12-16. If you declare stronger sexual references it can reach Mature 17+ or PEGI 16. Set the Play Console target audience to 18+ only, which keeps the app out of the Families policy. This is my reading of the IARC rating categories, not a confirmed rating.
- (c) AI disclosure: Apple's Review Guidelines only mention AI in 5.1.2(i), which requires consent before sharing personal data with third-party AI. That does not apply to a fully offline app with bundled images. Some blogs claim Apple has a general "AI-generated content disclosure" rule, but it does not appear in the guidelines text. Google Play's AI-Generated Content policy covers apps that generate content from user prompts and requires in-app reporting. Bundled, pre-generated portraits are effectively out of scope. Neither store asks for a label on static AI art. A one-line credit ("Portraits are AI-generated artistic reconstructions") is cheap goodwill and supports the EDSA framing.
- (d) Costs: Apple Developer Program is $99/yr. Google Play is a one-time $25, plus mandatory ID verification. A NEW personal Google Play account must run a closed test with at least 12 testers opted in for 14 continuous days before it can publish to production. The rule applies to every app on that account and is the biggest schedule hit. Organization accounts (need a D-U-N-S number) are exempt.
- (d) No Mac is needed. Unity on Windows exports the Xcode project, and a cloud Mac compiles, signs and uploads it to TestFlight or App Store Connect. Options: Unity Build Automation has a free tier with 100 Mac minutes/month since 1 Mar 2026. Codemagic gives 500 free macOS M2 minutes/month, then $0.095/min. GitHub Actions macOS runners are another route. Expo EAS only matters if the app is built in React Native/Expo rather than Unity. Since 28 Apr 2026, uploads must be built with Xcode 26 and the iOS 26 SDK, so pick a Unity version and cloud image that support it. Google Play requires targetSdk 36 (Android 16) for new apps since 31 Aug 2026; an extension to 1 Nov 2026 was available. Without a Mac, test on a real iPhone through TestFlight.
- Side legal note: Texas SB 2420 (App Store Accountability Act) is enforceable since the Supreme Court declined to block it on 6 Jul 2026, with Utah and Louisiana similar. These laws put age-signal duties on developers too. For an offline game rated 16+/18+, the stores mainly handle this, but check the Declared Age Range API requirements before launch.

**Recommendation:** Ship it, but frame it as a comedy and trivia party game about human evolution, not a rating app. Concretely:
1) Store name and listing: lead with evolution and trivia ("Natural Selection: an evolution party game"). Keep "Smash or Pass" out of the app name, icon and first screenshot. Use it as a subtitle or keyword at most. The in-game buttons can still say Smash and Cutoff.
2) Content: keep facts, descriptions and the science prominent on every stage (supports Google's EDSA exemption and Apple's "aesthetic" carve-out). Write jokes about the voting group, not about the hominins' looks. Never use race, ethnicity or "primitive/ugly" wording.
3) Image style: museum-quality, paleoart-style reconstructions (think Kennis & Kennis or Smithsonian), dignified neutral poses, fully clothed or in period hide or fur garments. No glamour, pin-up or "sexy caveman" styling, no suggestive poses, no cleavage or bare-chest focus, no photoreal skin close-ups. Keep the style consistent across all 10 species, and avoid exaggerated features that look like a caricature of living populations. This is the main defense against Apple 1.1 and 1.1.1.
4) Ratings: answer both questionnaires honestly. On Apple, mark "Frequent mature/suggestive themes" and manually choose 18+, which matches the precedent app and the 17+ intent. On Google, set the target audience to 18+ and declare sexual innuendo.
5) Add a one-line AI credit and an age gate or "17+ party game" splash. Do not add camera, photo upload or online sharing beyond the system share sheet, so Apple 1.2 never applies.
6) Logistics: start the Google closed test (12 testers for 14 days) early, or register an organization account. Use Codemagic's or Unity Build Automation's free Mac minutes for iOS. Pin a Unity LTS that builds with Xcode 26 and targets API 36.
7) Have a ready reply for App Review that stresses the education and comedy framing, and note that clothed, non-real characters are rated 18+. If Apple rejects it, the fallback is to rename the vote buttons (for example "Date / Extinct") while keeping the mechanic.

**Risks:**
- Apple 1.1 and 1.1.1 are subjective. A reviewer may find a smash vote on hominins in poor taste or racially loaded. Mitigate with dignified paleoart, education-first metadata and a fallback button rename.
- Apple 4.3 (spam): pass-the-phone party apps are saturated. The hominin and evolution content is the differentiator, so lead with it.
- Google's 12-tester, 14-day closed test on new personal accounts delays the Android launch by at least two weeks.
- No Mac means no iOS Simulator. Debug on device through TestFlight, and produce App Store screenshots at the required sizes (e.g. 6.9-inch, 1320x2868) from device captures or Unity renders.
- Xcode 26 / iOS 26 SDK and Android targetSdk 36 requirements constrain the Unity version and cloud build image.
- AI image tools may refuse or drift toward sexualised output. Review every portrait by hand for suggestiveness before bundling. Google bans 'sexually suggestive poses' even with clothing on.
- Google Play content ratings for existing smash-or-pass apps could not be confirmed (pages did not load), so the Google rating estimate is unconfirmed.
- Texas, Utah and Louisiana app store age laws keep changing. Re-check developer duties before launch.
- The later paywall (stages 1-3 free) must use Apple IAP and Google Play Billing for in-app unlocks.

**Reviewer corrections:**
- Google Play sexual-content wording is overstated. The ban is on 'sexual nudity, or sexually suggestive poses in which the subject is nude, blurred or minimally clothed', and the EDSA exemption covers nudity only ('Content that contains nudity may be allowed if the primary purpose is educational, documentary, scientific or artistic'). The risk line saying Google bans suggestive poses 'even with clothing on' is wrong for fully clothed portraits. It does matter for skimpy hide or fur outfits, which could count as 'minimally clothed'. The same policy also bans 'apps that degrade or objectify people'. That clause targets undress apps, but it is the closest Google hook a reviewer could use. Source: https://support.google.com/googleplay/android-developer/answer/9878810
- The Apple rating mapping is right but incomplete. Per Apple's table, infrequent mature or suggestive themes gives 9+, frequent gives 16+, infrequent sexual content or nudity gives 13+, frequent gives 18+, and graphic content is Unrated, which means it cannot be published. The override exists: 'Override to Higher Age Rating' in App Store Connect. A EULA minimum age above the computed rating makes the override mandatory, so if the in-app splash says 17+/18+, the store rating must match. Sources: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions and https://www.developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating
- Minor: the Apple guideline 4.3 spam risk is specifically 4.3(b): 'Don't submit apps that are indistinguishable from what's already widely available. Opportunistically creating variants of existing app categories...'. A generic smash-or-pass clone falls squarely under it, which strengthens the advice to lead with the evolution content. Source: https://developer.apple.com/app-store/review/guidelines/
- Verified as correct: the Texas SB 2420 SCOTUS denial on 6 Jul 2026 (stay pending appeal, not a merits ruling), Xcode 26 / iOS 26 SDK from 28 Apr 2026, targetSdk 36 from 31 Aug 2026 with extension to 1 Nov 2026, 12 testers for 14 continuous days on personal accounts created after 13 Nov 2023, Unity Build Automation free tier of 100 Mac minutes/month from 1 Mar 2026, and the Apple 1.2 'hot-or-not' text being in the UGC section. Sources: https://www.scotusblog.com/2026/07/supreme-court-allows-texas-to-enforce-law-requiring-age-verification-and-parental-consent-on-app/ , https://developer.apple.com/news/upcoming-requirements/ , https://support.google.com/googleplay/android-developer/answer/11926878?hl=en , https://support.google.com/googleplay/android-developer/answer/14151465?hl=en , https://support.unity.com/hc/en-us/articles/34748492914964-Understanding-New-Unity-DevOps-charges-starting-from-Mar-1-2026

**Reviewer additions:**
- Picking 18+ on Apple has a real cost the finding missed. Since 24 Feb 2026, Apple blocks downloads of 18+ apps in Brazil, Australia and Singapore unless the App Store has confirmed the user is an adult. Recommendation step 4 ('manually choose 18+') should weigh this: accept the computed 16+ unless the developer wants the extra friction. Sources: https://developer.apple.com/news/?id=f5zj08ey and https://www.macrumors.com/2026/02/24/apple-updated-age-assurance-requirements/
- Apple guideline 2.3.8 requires the icon, screenshots, previews and IAP images to meet a 4+ standard even when the app is rated higher, and metadata to be 'appropriate for all audiences'. This argues for keeping 'Smash' out of the store subtitle and keywords too, not just the name and icon (affects step 1). Source: https://developer.apple.com/app-store/review/guidelines/
- Public address exposure once the paywall is added. Apple's EU DSA rules make any developer earning money (paid app or IAP) a 'trader', and Apple publishes their address, phone and email on EU product pages. Google Play publishes the full address of personal accounts that monetize. For a solo developer, this argues for a business address or PO box, or an organization account, before turning on the stages 1-3 paywall. Sources: https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/ and https://support.google.com/googleplay/android-developer/answer/13628312?hl=en
- Google's AI-Generated Content policy page explicitly excludes apps that merely host AI content, which supports the finding's claim that bundled portraits are out of scope. The finding cited the wrong page; the right source is https://support.google.com/googleplay/android-developer/answer/14094294?hl=en
- The finding never weighs the no-store option, though the user said they are 'not married to' an app. An offline PWA or web build sidesteps App Review subjectivity (1.1/1.1.1/4.3(b)), the $99/yr fee, the 14-day Google closed test and the Mac/Xcode 26 toolchain. The Web Share API with files covers the share-image requirement on iOS Safari and Android Chrome. It is worth a line as a fallback or soft-launch path if Apple rejects the app.

**Sources:**
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions
- https://developer.apple.com/news/?id=ks775ehf
- https://www.macobserver.com/news/apple-adds-new-app-store-age-ratings-13-16-and-18/
- https://ecorpit.com/app-store-social-media-declaration-age-assurance-readiness-2026/
- https://apps.apple.com/us/app/smash-or-pass-group-games/id6736897283
- https://play.google.com/store/apps/details?id=com.danpanichev.animedate&hl=en
- https://play.google.com/store/apps/details?id=com.grathoapps.smashorpass
- https://support.google.com/googleplay/android-developer/answer/9878810
- https://support.google.com/googleplay/android-developer/answer/13985936
- https://support.google.com/googleplay/answer/6209544?hl=en
- https://www.globalratings.com/ratingsguide.aspx
- https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- https://magora-systems.com/apple-developer-fee/
- https://blog.codemagic.io/publishing-unity-ios-apps/
- https://codemagic.io/pricing/
- https://support.unity.com/hc/en-us/articles/34748492914964-Understanding-New-Unity-DevOps-charges-starting-from-Mar-1-2026
- https://developer.apple.com/news/upcoming-requirements/
- https://expo.dev/blog/app-store-connect-minimum-sdk-26
- https://www.infolawgroup.com/insights/2026/7/7/supreme-court-clears-the-way-texass-app-store-accountability-act-is-now-enforceable
- https://fpf.org/blog/comparing-enacted-app-store-accountability-acts/

## name

- US trademark conflict is real. Unknown Worlds Entertainment holds NATURAL SELECTION, US Reg. 4179393 (serial 85494599). It is LIVE, was renewed in 2022 (Sec. 8/9), and covers Class 41: "providing an interactive multi-player online electronic real-time strategy game". It is the only owner in our results with a live "Natural Selection" mark for games.
- That owner is still active. Natural Selection 2 is still sold on Steam ($4.99) with a small but steady player base (about 60-176 concurrent players in 2026). Unknown Worlds (Subnautica) is well funded and settled its dispute with Krafton in July 2026, so the brand is not abandoned.
- Other US filings are weak or dead. Natural Selection Tour Inc. filed for "Natural Selection" in Class 9 (a mobile app) and "Natural Selection Tour". Both were abandoned in 2023 and 2024 with no statement of use. The other "Natural Selection" marks found are food, wine, first aid and bath products, all unrelated classes. "UN NATURAL SELECTION" in Class 28 (computer games) was cancelled in 2002. R&R Games sells a live "UnNatural Selection®" card game, so that variant is also taken.
- App Store (iOS) has: "Natural Selection Sim" (Amplify, education, 4+, last updated 2022) and "Samsara - Natural Selection" (a game). Google Play has: "Natural Selection Simulation" (MisteR Apps, 1K+ installs), "Natural Selection University" (a strategy game), and "Natural Selection Crossfit". None is a party game. But the bare name is not unique in either store, and search results for it are crowded with NS2 and school apps, which hurts discoverability.
- I could not run EUIPO or UKIPO searches: both databases need JavaScript sessions and returned nothing usable through web search. That check is still open. Search TMview (tmdn.org/tmview) and the UK IPO "search for a trade mark" for "NATURAL SELECTION" in Classes 9, 28 and 41 before committing.
- Risk assessment. Legal risk is MEDIUM: "natural selection" is a scientific phrase, so the mark is relatively weak. A pass-the-phone 17+ party game is also far from a sci-fi RTS, so a court might find no confusion. But the goods are related (games), and Apple and Google act on IP complaints (App Review Guideline 5.2) without deciding who is right. One email from Unknown Worlds could get the listing pulled or force a rename after launch. Practical risk (store search, discoverability) is HIGH.
- Close names already taken: "Smash or Pass" (many 18+ apps, so the space is crowded), "Missing Link" (several puzzle apps and a board game), "Descent of Man" (a 2020 Steam horror game). Searches found no app or game named "Survival of the Flirtest" (only a 2019 relationship book), "Smash or Cutoff", or "Thirst Through Time".

**Recommendation:** Don't ship with bare "Natural Selection" as the store title or the main brand. Use a different main name and keep "natural selection" only as a descriptive phrase in the subtitle or description. Five options that keep the joke:
1. "Survival of the Flirtest". Top pick: no app or game found with this name, the Darwin pun is instantly clear, and it fits a 17+ rating.
2. "Survival of the Flirtest: Smash or Cutoff". The same name with the vote mechanic as the store subtitle, which helps search without using someone else's mark.
3. "Smash or Cutoff: Evolution Edition". Leans on "smash or pass", a search term that already pulls traffic. "Cutoff" makes it different, though the space is crowded.
4. "Thirst Through Time". Unique, and it describes the walk back through the ancestors. The joke is softer.
5. "How Far Back Would You Go?". Searches found nothing with this name. It names the core question of the game, and "natural selection" can go in the subtitle as a description ("a natural-selection party game").
If you want to keep the name anyway: use a qualified form like "Natural Selection: Smash or Cutoff", and accept that it stays medium risk. A short check with a trademark lawyer (or at least the TMview and UK IPO searches) is worth it before you spend money on art and marketing. Whatever you pick, register your own mark in Class 9 and Class 41 once you know the app will last; for a quick side release that can wait. Before you lock the name, also check that the domain and social handles are free.

**Risks:**
- Unknown Worlds' live US registration 4179393 (Class 41, games) may lead to an App Store or Play IP complaint and a forced rename after launch if 'Natural Selection' is the main name.
- The EUIPO and UKIPO checks were not done because their databases cannot be searched this way. There may be EU or UK registrations (Unknown Worlds or others) that change the picture. Search TMview and the UK IPO manually.
- Store search for 'Natural Selection' is already crowded with NS2, Amplify's school sim and others, so a new party game would be hard to find under that name.
- 'UnNatural Selection' is a live R&R Games card-game mark, so that wordplay is out too.
- Sexual words in the main title (e.g. 'Sexual Selection', 'Smash') can draw extra App Review scrutiny or store search filtering even at 17+. That favours softer puns like 'Survival of the Flirtest'.
- None of this is legal advice. A one-off clearance search by a trademark professional is the reliable check before you invest in branding.

**Reviewer corrections:**
- Options 2 and 3 and the fallback name break store length limits. Apple Guideline 2.3.7 says app names must be 30 characters or fewer (https://developer.apple.com/app-store/review/guidelines/). Google Play titles are also capped at 30 characters. 'Survival of the Flirtest: Smash or Cutoff' is 41 characters, 'Smash or Cutoff: Evolution Edition' is 34, and 'Natural Selection: Smash or Cutoff' is 34. Use 'Survival of the Flirtest' (24) as the title and 'Smash or Cutoff' as the separate subtitle or short description.
- The finding understates how narrow the Unknown Worlds registration is. Reg. 4179393 covers 'providing an interactive multi-player online electronic real-time strategy game involving aliens in an atmospheric sci-fi environment' (https://www.trademarkia.com/natural-selection-85494599). A narrow description makes confusion with an offline pass-the-phone party game less likely. Legal risk is closer to low-medium than medium. Store-takedown and discoverability risk stays the same, so the advice to rename does not change.
- 'Owner is well funded' leaves out who the owner is. The Steam page lists KRAFTON, Inc. as co-publisher of NS2 (https://store.steampowered.com/app/4920/Natural_Selection_2/), and Unknown Worlds belongs to Krafton. That makes the owner a large company, and the settlement news supports this (https://www.gamedeveloper.com/business/krafton-agrees-to-pay-bonuses-to-subnautica-2-studio-as-ceo-resigns). The claim itself checks out. A settlement was announced July 1, 2026, and CEO Ted Gill stepped down (https://kotaku.com/the-big-subnautica-2-legal-drama-has-finally-been-settled-and-the-ceo-who-was-originally-fired-is-now-leaving-voluntarily-2000711969).
- The NS2 price of '$4.99' changes by region and sale. The UK store shows £4.29, and it is on sale today at £0.85 (https://store.steampowered.com/app/4920/Natural_Selection_2/). The page's dev note dates from 2019, so the game is still sold but rarely updated. This is minor and does not affect the conclusion.
- The App Review 5.2 point is roughly right but overstated. Apple says an app 'may be removed' and sends IP claims through a dispute form (https://developer.apple.com/app-store/review/guidelines/). A complaint triggers that process. It does not mean automatic removal.

**Reviewer additions:**
- Fallback naming has to fit 30 characters on both stores. Put the vote mechanic in the subtitle field, not the title.
- The user is 'not married to an app'. A web or PWA release avoids store search and takedown problems, but US trademark law still applies to it.
- 'Survival of the Flirtest' is a common pun. Being free of any trademark only means nobody has registered it, not that it is safe to claim. It is also likely too weak or descriptive to register strongly later. A USPTO search by me found no filing (https://uspto.report/TM/), but searches cannot be run directly from here. Check USPTO TSDR or the Trademark Search tool by hand, plus the iOS and Play stores, because web search does not index store listings well.
- The R&R Games 'UnNatural Selection' mark is confirmed live: US Reg. 4502997, Class 28, a party board game, with Sec. 8 & 15 accepted (https://trademarks.justia.com/858/36/unnatural-85836258.html). It is the closer conflict, because it is also a party game. That makes 'Natural Selection' as a party-game name riskier than the finding's NS2-only focus suggests.
- No app or game called 'Survival of the Flirtest', 'Smash or Cutoff' or 'Thirst Through Time' turned up in my searches. Only the 2019 Kaitlin Endres book uses the first name (https://www.amazon.com/Survival-Flirtest-Finding-Keeping-Relationships/dp/7339073094). 'How Far Would You Go?' is a common TikTok party-game format and an itch.io title (https://nmiel.itch.io/how-far-would-you-go1). That makes option 5 less distinctive than the finding claims.

**Sources:**
- https://www.trademarkia.com/natural-selection-85494599
- https://www.trademarkelite.com/trademark/trademark-owner/Unknown%20Worlds%20Entertainment,%20Inc.
- https://uspto.report/company/Unknown-Worlds-Entertainment-Inc
- https://en.wikipedia.org/wiki/Natural_Selection_2
- https://en.wikipedia.org/wiki/Natural_Selection_(video_game)
- https://steamdb.info/app/4920/
- https://steamplayercount.com/app/4920
- https://www.gamedeveloper.com/business/krafton-agrees-to-pay-bonuses-to-subnautica-2-studio-as-ceo-resigns
- https://www.trademarkia.com/natural-selection-88344997
- https://www.trademarkia.com/natural-selection-tour-88714340
- https://trademarks.justia.com/744/69/un-natural-selection-74469136.html
- https://rnrgames.com/unnatural-selection
- https://apps.apple.com/us/app/natural-selection-sim/id910261072
- https://apptopia.com/ios/app/923862810/about
- https://play.google.com/store/apps/details?id=com.misterapps.naturalselection
- https://play.google.com/store/apps/details?id=com.budai.rpg&hl=en_US
- https://play.google.com/store/apps/details?id=natural.selection.crossfit&hl=en_IN
- https://www.coolmathgames.com/0-natural-selection
- https://boardgamegeek.com/boardgame/386145/natural-selection-combine-and-create
- https://apps.apple.com/us/app/smash-or-pass-group-games/id6736897283
- https://apps.apple.com/us/app/missing-link/id494193768
- https://store.steampowered.com/app/970450/Descent_of_Man/
- https://www.amazon.com/survival-flirtest-Kaitlin-Endres/s?k=survival+of+the+flirtest+Kaitlin+Endres
- https://www.euipo.europa.eu/en/search-ip

## facts

- 1. Homo sapiens. OK. The oldest fossils come from Jebel Irhoud, Morocco, dated 315 +/- 34 ka (Hublin et al. 2017), so "~300ka" is fine. Fact: our oldest fossils are from Morocco, not East Africa. The faces are already modern, but the braincase is long and archaic. Punchline: "Pretty face, weird-shaped head. Classic us."
- 2. Neanderthal. OK. Smithsonian gives ~400-40 ka, and up to ~2% of non-African DNA (older estimates said 1-4%). A 2024 study puts the main interbreeding at ~47 ka, lasting about 7,000 years. Fact: a Neanderthal DNA segment on chromosome 3 raises the risk of severe COVID up to 3x. About 50% of South Asians and 1 in 6 Europeans carry it (Zeberg & Paabo, Nature 2020). Punchline: "Your ancestors already said yes. You inherited the receipts." Note: the Schoningen spears were redated in 2025 to ~200 ka and now count as Neanderthal work.
- 3. Denisovan. Upgrade the hook. In June 2025, proteins (Science) and mtDNA from tartar (dental calculus) on the teeth (Cell) showed the Harbin "Dragon Man" skull (>=146 ka) is Denisovan. That gives Denisovans a face, which helps the AI portraits. Also from 2025: the Penghu jaw from the sea floor off Taiwan was identified as a Denisovan male, and a preprint reports a high-coverage genome from a 200 ka molar (Denisova 25). Safe range: ~200-50 ka from fossils, with the lineage possibly far older. Interbreeding: ~5% of Papuan ancestry, plus the high-altitude EPAS1 gene in Tibetans. Fact: Denisova 11, a girl who died ~90 ka, had a Neanderthal mother and a Denisovan father (Slon et al., Nature 2018). Punchline: "Neanderthal mom, Denisovan dad. Thanksgiving was tense."
- 4. H. heidelbergensis. The 700-200 ka range is OK (Smithsonian). The "common ancestor" claim is the weakest in the list. The 2021 H. bodoensis proposal wanted to scrap the name. Sima de los Huesos (~430 ka), once counted as heidelbergensis, turned out genetically to be early Neanderthals (Meyer, Nature 2016). The 2025 Yunxian 2 reconstruction (Science, with Stringer) argues the sapiens, Neanderthal and Denisovan lines split before 1 Ma. Write "possibly near the common ancestor", and do not use the Schoningen spears for this stage. Fact: Sima de los Huesos holds ~28 individuals at the bottom of a deep cave shaft, possibly placed there on purpose. Punchline: "Scientists can't agree what to call him. Neither can his exes."
- 5. H. erectus. OK: ~1.89 Ma to 117-108 ka (Ngandong, Nature 2019). "Left Africa": the first species with fossils outside Africa (Dmanisi 1.85-1.77 Ma; the Yunxian skulls were redated to ~1.77 Ma in Science Advances, 2026). But stone tools at Shangchen, China, at 2.1 Ma mean someone left even earlier, so say "the first we know of". Fire: say "probably the first to use fire". Use is reasonably solid at Wonderwerk ~1 Ma and claimed at 1.5 Ma (Koobi Fora). A 2026 PLOS ONE paper argues ~1.8 Ma. Making fire came much later. Fact: the species lasted ~1.8 million years, about 6x longer than sapiens so far. Punchline: "Went 1.8 million years. Can you say the same?"
- 6. H. floresiensis. Skeletons date to 100-60 ka and tools to 190-50 ka, so "100-50 ka" is acceptable. Height: Smithsonian gives 1.06 m and ~30 kg, so "~1.1 m" is fine. How related: a cousin and evolutionary dead end, not our ancestor. Its origin (shrunken erectus vs earlier Homo) is unresolved. A 700 ka arm bone from Mata Menge (Nature Communications 2024) shows they were small early on. Fact: they hunted pygmy elephants (Stegodon) and lived alongside Komodo dragons. Punchline: "Three foot six and hunts elephants. Confidence is attractive."
- 7. H. habilis. OK at 2.4-1.4 Ma. The tool claim is out of date. Lomekwi 3 tools are 3.3 Ma (Harmand, Nature 2015), and Oldowan tools at Nyayanga (2.9 Ma) were found with Paranthropus, not Homo. It overlapped with erectus for ~500 ka. Also from 2026: the most complete habilis skeleton yet (KNM-ER 64061, ~2.04 Ma, Anatomical Record) shows long, ape-like arms and ~31-33 kg. Fact: nicknamed "Handy Man" for toolmaking, yet the oldest tools predate it by ~900,000 years. Punchline: "Handy Man. Took credit for someone else's tools."
- 8. A. afarensis. OK: 3.85-2.95 Ma (Smithsonian). In 2025, Ledi-Geraru (Nature) confirmed nothing of Lucy's kind is younger than 2.95 Ma. Lucy: 3.2 Ma, found 1974, named after "Lucy in the Sky with Diamonds". Fact: a 2016 Nature paper argues her fractures came from a fall out of a tall tree (still contested). Also, the Laetoli footprints are 3.66 Ma. Punchline: "Lucy fell hard for someone. Out of a tree, specifically."
- 9. Ardipithecus ramidus. OK: 4.4 Ma, with a grasping big toe that pointed out to the side on an otherwise rigid foot. Female ~120 cm and ~50 kg. Ardi lived in woodland, which undercut the "we stood up on the savanna" idea. Fact: males had small canines, read as less male-male fighting (that reading is debated). Ardi was found in 1994 but took 15 years to publish (2009). Punchline: "Opposable big toe. Keeps the hands free."
- 10. Sahelanthropus tchadensis. The 7-6 Ma date is OK. Bipedalism is a live fight. Williams et al. (Science Advances, Jan 2026) report a femoral tubercle (a hip ligament attachment) as evidence it walked upright. Macchiarelli and Cazenave reply the evidence is "weak" and the fossil too damaged. Smithsonian's page still says no bones below the skull, which is out of date: a disputed femur and ulnae exist. Write "may have walked upright". Fact: "Toumai" means "hope of life" in Goran. Punchline: "'Hope of life.' Hope is doing a lot of heavy lifting here."
- Order and swaps. "Most to least familiar" works and mostly tracks age. But Neanderthals, Denisovans and floresiensis are cousins, not ancestors, so the copy should say "relatives". Best swap: Homo naledi (335-236 ka, Rising Star cave, 1,550+ bones, burial claim argued again in eLife 2025). It is a strong replacement for the shaky heidelbergensis stage or a stage 11. Optional: label stage 3 "Denisovan ('Dragon Man')", which is more familiar and now justified.

**Recommendation:** Keep the 10-stage spine, but fix four claims in the copy. (1) heidelbergensis: "possibly near our common ancestor", not "common ancestor". (2) erectus: "first we know left Africa" and "probably first to use fire". (3) habilis: make the punchline the tool myth. (4) Sahelanthropus: "may have walked upright", noting the 2026 dispute. Use the 2025 Harbin finding to give Denisovans a face. Consider swapping H. heidelbergensis for Homo naledi, or adding naledi as a bonus stage. Use "relatives", never "ancestors", for Neanderthals, Denisovans and floresiensis. Store a source URL and a "last checked" date per fact in the bundled data, so updates are cheap.

**Risks:**
- Taxonomy keeps moving: Yunxian has been called both erectus (1.77 Ma, Science Advances 2026) and a Denisovan/longi relative (Yunxian 2, Science 2025). H. longi vs Denisovan naming and heidelbergensis vs bodoensis may change again. Keep species labels editable in the data.
- Smithsonian pages lag the research. The heidelbergensis page still cites the Schoningen spears at 400 ka, and the Sahelanthropus page says there are no bones below the skull. Cross-check before using its copy verbatim.
- Some hooks rest on single or contested studies: Denisova 25 is a bioRxiv preprint, Wonderwerk fire at ~1.8 Ma is one PLOS ONE paper, and the Lucy tree-fall death and the naledi burials are disputed. Phrase these as 'scientists think' or 'one study suggests'.
- Portraits of Sahelanthropus and Ardi bodies are largely made up. Sahelanthropus is mostly skull. An optional on-screen note ('artist's impression') protects credibility.
- App store and PR risk. Sexualized or 'ape-like dark-skinned' renderings of hominins can read as racist stereotyping. Keep portraits clothed and non-sexual, avoid modern ethnic coding, and expect closer review given the smash-or-pass framing.
- The COVID-gene punchline may land badly with some groups. Keep an alternate Neanderthal fact (e.g. brains as large as or larger than ours).

**Reviewer corrections:**
- H. erectus start date is out of date. The oldest known erectus is DNH 134 from Drimolen, South Africa, at 2.04-1.95 Ma (Herries et al., Science 2020: https://www.science.org/doi/10.1126/science.aaw7293). An adult Drimolen fossil (DNH 127), published 30 Sep 2026 in Annals of Human Biology, backs a first appearance at ~2 Ma (https://phys.org/news/2026-09-adult-fossil-evidence-homo-erectus.html). Use ~2.0 Ma to ~110 ka, about 1.9 Myr in all, or 6-7x sapiens. The 1.89 Ma start comes from Smithsonian, which lags here too. The punchline still works if it says 'nearly 2 million years'.
- 'Making fire came much later' needs a date. The oldest direct evidence of fire-making is ~400 ka at Barnham, UK: pyrite plus flint, probably early Neanderthals (Nature, Dec 2025: https://www.nature.com/articles/s41586-025-09855-6). That is ~350 kyr earlier than the previous evidence. It is also a good fact for the Neanderthal or heidelbergensis stage.
- Wonderwerk PLOS ONE 2026 (June 2026) is a range of 1.07-1.79 Ma, not a point at ~1.8 Ma. The authors say erectus carried and kept natural fire, and could not make it (https://www.sciencedaily.com/releases/2026/06/260623083123.htm). Write 'possibly as early as 1.8 Ma'.
- Sahelanthropus critique: the 'weak evidence' quote comes from Marine Cazenave (MPI-EVA). Macchiarelli said the femur is too warped to show the tubercle and that body proportions are '100 percent apelike' (https://www.scientificamerican.com/article/earliest-human-ancestor-may-have-walked-on-two-legs/). The substance holds. Confirmed: the Smithsonian page still says 'no post-cranial fossils'.
- KNM-ER 64061 dates to 2.02-2.06 Ma, so ~2.04 Ma is fine. The authors also estimate stature at ~1.6 m from the humerus, at 30.7-32.7 kg (https://www.sci.news/othersciences/anthropology/homo-habilis-skeleton-14485.html). This is a minor addition. If used, phrase it as 'long, strong arms' rather than 'ape-like'.
- Homo naledi: the 1,550+ count is the 2015 Dinaledi figure. The total is now well over 2,000 elements from several chambers. The eLife burial paper's Version of Record came out 1 Sep 2025, and reviewers stayed unconvinced (https://elifesciences.org/articles/89106; https://www.science.org/content/article/ancient-human-relative-really-bury-dead). Keep 'scientists argue'.
- Ardi and woodland is contested. Cerling et al. (Science 2010) argued the Ardi setting was grassier and savanna-like. Soften to 'lived in or near woodland, which challenged the savanna idea'.
- Schoningen: the 2025 Science Advances redating to ~200 ka is real (https://www.science.org/doi/10.1126/sciadv.adv0752). The 'Neanderthal' attribution is the authors' inference, since no hominin fossils were found with the spears. Say 'likely Neanderthal'.
- Penghu jaw: the sex (male) and Denisovan ID are solid (Science, Apr 2025). Its age is poorly constrained (~10-70 ka or ~130-190 ka). Do not quote a date for it.

**Reviewer additions:**
- Swapping H. heidelbergensis for H. naledi weakens the game's premise. Naledi is a definite side branch. It is small-brained, so its portrait would look like habilis. At ~335-236 ka it would also sit out of chronological order. Heidelbergensis, whatever its name, stays the best 'possible ancestor' at the 700-200 ka slot. Naledi fits better as a bonus stage than as a swap.
- Naming risk for stage 3: Harbin is the holotype of Homo longi. If Harbin is Denisovan, some argue that H. longi is the formal species name for Denisovans, and H. juluensis was also proposed in 2024. Label the stage 'Denisovan' and keep 'Dragon Man' as a nickname. Do not use 'H. longi' as the main label.
- Yunxian conflict, more specifically: the Science 2025 Yunxian 2 paper assumed the skull was ~1 Ma. The 2026 cosmogenic redating puts the site at ~1.77 Ma and calls the skulls erectus. That undercuts the 'split before 1 Ma' argument for the heidelbergensis stage, so do not use Yunxian 2 in that stage's copy.
- Verified as accurate (no change needed): Jebel Irhoud 315+/-34 ka; Neanderthal interbreeding ~50.5-43.5 ka, average ~47 ka (Science, Dec 2024); COVID variant in ~50% of South Asians, 1 in 6 Europeans, ~3x ventilation risk (KI); Harbin Denisovan mtDNA from calculus (Cell) and proteome (Science), June 2025, >146 ka; Denisova 25 bioRxiv preprint, Oct 2025, layer dated 200-170 ka; Ledi-Geraru, Nature, Aug 2025 (no afarensis younger than 2.95 Ma); floresiensis 106 cm, 30 kg, Stegodon and Komodo dragons (Smithsonian); the Smithsonian heidelbergensis page still cites the Schoningen spears at 400 ka.

**Sources:**
- https://www.nature.com/articles/nature22336
- https://humanorigins.si.edu/evidence/human-fossils/species/homo-neanderthalensis
- https://humanorigins.si.edu/evidence/genetics/ancient-dna-and-neanderthals
- https://www.sciencedaily.com/releases/2024/12/241212145726.htm
- https://news.ki.se/neandertal-gene-variant-increases-risk-of-severe-covid-19
- https://www.science.org/doi/10.1126/sciadv.adv0752
- https://english.cas.cn/research/highlight/palaeontology/202506/t20250619_1045850.shtml
- https://www.sciencenews.org/article/denisovans-taiwan-jaw-fossil-evidence
- https://www.biorxiv.org/content/10.1101/2025.10.20.683404v1.abstract
- https://www.sci.news/genetics/denisova-11-genome-06333.html
- https://www.nature.com/articles/nature13408
- https://www.sci.news/genetics/denisovan-dna-papuans-immune-system-11464.html
- https://humanorigins.si.edu/evidence/human-fossils/species/homo-heidelbergensis
- https://pmc.ncbi.nlm.nih.gov/articles/PMC9297855/
- https://www.nature.com/articles/nature17405
- https://www.nhm.ac.uk/press-office/press-releases/analysis-of-reconstructed-ancient-skull-pushes-back-our-origins-.html
- https://humanorigins.si.edu/evidence/human-fossils/species/homo-erectus
- https://www.nature.com/articles/s41586-019-1863-2
- https://www.science.org/doi/10.1126/sciadv.ady2270
- https://www.sciencenews.org/article/shangchen-stone-tools-put-early-hominids-china-earlier
- https://www.sci.news/archaeology/wonderwerk-cave-fire-use-14848.html
- https://www.journals.uchicago.edu/doi/full/10.1086/692530
- https://humanorigins.si.edu/evidence/human-fossils/species/homo-floresiensis
- https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11303730/
- https://humanorigins.si.edu/evidence/human-fossils/species/homo-habilis
- https://www.nhm.ac.uk/discover/homo-habilis-early-maker-stone-tools.html
- https://geology.rutgers.edu/images/Publications_PDFS/Harmand_et_al_2015_short.pdf
- https://www.shh.mpg.de/2333206/somebody-used-stone-tools-to-butcher-hippos-2
- https://pubmed.ncbi.nlm.nih.gov/41527936/
- https://www.nature.com/articles/s41586-025-09390-4
- https://humanorigins.si.edu/evidence/human-fossils/species/australopithecus-afarensis
- https://www.nature.com/articles/nature19332
- https://humanorigins.si.edu/evidence/human-fossils/species/ardipithecus-ramidus
- https://humanorigins.si.edu/evidence/human-fossils/species/sahelanthropus-tchadensis
- https://www.science.org/doi/10.1126/sciadv.adv0130
- https://www.johnhawks.net/p/how-sahelanthropus-tchadensis-moved
- https://humanorigins.si.edu/evidence/human-fossils/species/homo-naledi
- https://elifesciences.org/articles/89106/peer-reviews

## platform

- Ranking: 1) PWA (Vite + TypeScript + Svelte or plain TS), 2) the same web build wrapped in Capacitor later for the stores, 3) Expo/React Native, 4) Unity native, 5) Flutter, 6) Kotlin Multiplatform. Unity WebGL comes last for this app.
- The share image works on the web now. navigator.share with files is supported in iOS Safari 14+ (through 27.x), Chrome Android, Samsung Internet 11.1+, and desktop Chrome/Edge/Safari. It covers about 93% of users. Firefox (desktop and Android) is the main gap, so fall back to a PNG download (caniuse). The call needs HTTPS and a user tap (transient activation). Check canShare() first (MDN).
- iOS PWA install got easier. In iOS 26, Add to Home Screen opens any site as a standalone web app by default. There is still no install prompt, so the game needs a short "Share > Add to Home Screen" hint. A service worker precache of the 6 screens plus about 20 WebP portraits (roughly 2-4 MB) gives fully offline play. No Mac, no review and no store fees are needed to ship.
- Unity: your skills carry over and UI Toolkit is now production-ready (Unity 6.7: Advanced Text Generator is the default and text CPU use is 10-40% lower). But it is heavy for a 6-screen text app. An empty Unity 6 web build is about 8 MB and uses about 200 MB of RAM, which is 40% of the iOS ~500 MB budget, and it loads slower than web-native. Native iOS builds from Windows are possible through Unity Build Automation (free tier: 100 Mac minutes a month since March 2026). The usual share plugin, yasirkula NativeShare, is now marked "no longer maintained".
- Expo/RN is the best native-first option from Windows: EAS Build makes signed iOS builds on Expo's Macs, and EAS Submit runs on Windows. Flutter is fine but means learning Dart, and iOS builds need Codemagic or another cloud Mac. KMP/Compose Multiplatform is overkill and the most Mac/Xcode-dependent, so it is ruled out.
- Store risk is real but manageable. Apple 1.2 names "objectification of real people (e.g. 'hot-or-not' voting)", and 1.1 bans content that is "just plain creepy". Hominins are not real people and the portraits are clothed, and an 18+ "Smash Or Pass: Group Games" app is live on the App Store, so there is precedent. Apple 4.2 (minimum functionality, "beyond a repackaged website") also applies to a Capacitor wrapper. Apple's new 13+/16+/18+ age-rating questionnaire is mandatory (deadline was 31 Jan 2026). Shipping web-first sidesteps all of this.
- Paywall seam: on the web, use Stripe or Lemon Squeezy checkout to an unlock code stored locally. This works offline once unlocked but is easy to bypass, which is fine for a joke app. In stores, use IAP (RevenueCat works for both Capacitor and Expo). US external payment links are 0% commission for now, but the Supreme Court has taken the case (cert granted July 2026) and Apple has asked for up to 15%, so this is not settled.
- C#-on-web (Blazor WASM) does not fix the problem: the payload is large and you would still be learning a web UI stack. A dev who knows web tools gets the most out of the small TS surface here.

**Recommendation:** Go web first, and wrap it for the stores later only if it takes off.

1. Build a PWA with Vite + TypeScript + Svelte, or plain TS if you want zero framework. Put stage content in /content/stages.json plus /content/img/*.webp so it is easy to edit. Add a manifest and a service worker (vite-plugin-pwa / Workbox) that precaches everything. Use six screens with a tiny state machine. Host on any static HTTPS host (GitHub Pages, Cloudflare Pages, Netlify), which suits the fresh GitHub repo.
2. Make the end-screen image with an offscreen canvas as soon as the end screen loads, so the PNG File already exists when the player taps Share. Then call navigator.share({files}) directly in the tap handler after canShare(). Fall back to a PNG download, plus copied text, when sharing is not supported.
3. Build the paywall seam now as a single isUnlocked(stageIndex) check (stages 1-3 free) that is backed by local storage. Wire in Stripe/Lemon Squeezy unlock codes later.
4. If store presence is ever worth it, wrap the same build in Capacitor. Use the Share plugin and an IAP plugin, and do cloud iOS builds via Codemagic or Capgo (no Mac needed). Add app-like polish (haptics, native share, offline) to clear Apple 4.2, rate it 18+, and keep the portraits clearly clothed and educational.

Use Unity only if you would rather stay 100% in C# and accept a ~100x heavier runtime for a text app. If so, go native (not WebGL), use UI Toolkit, use Unity Build Automation for iOS, and fork or replace NativeShare. Pick Expo over Flutter or KMP if you ever want a native-first rewrite.

**Risks:**
- Apple review: 1.1 'just plain creepy' and the 1.2 hot-or-not wording give the reviewer room to reject a 'smash' game even though hominins are not real people. Mitigate by going web first, rating it 18+, keeping the portraits clothed and science-framed, and possibly using a softer button label for the store build.
- Apple 4.2/4.3: a thin Capacitor wrapper can be rejected as a 'repackaged website' or as indistinguishable from existing smash-or-pass apps.
- Google Play sexual-content and AI-generated-content policies apply to the AI portraits. Keep provenance notes and keep the art non-sexualised.
- Web Share needs a live user tap. Async image generation done inside the click can throw NotAllowedError on Safari, so pre-render the image before the tap.
- Firefox (desktop and Android) has no file sharing, so a download fallback is required.
- iOS has no automatic install prompt, so users must add the app manually. Offline play depends on the first online visit fully precaching the assets.
- A client-only web paywall is easy to bypass. That is acceptable for a side project but not real DRM.
- The US external-payment rules are in flux: 0% now, Apple has asked for up to 15%, and the Supreme Court will hear the case. Do not build pricing around the 0% window.
- Unity path: about 200 MB RAM for an empty web build on iOS, slow first load, NativeShare is unmaintained, and Mac build minutes are capped on the free tier.
- Copyright and likeness: AI-generated portraits should avoid resembling real museum reconstructions (e.g. Kennis brothers / Daynès sculptures).

**Reviewer corrections:**
- Supreme Court cert in Apple v. Epic was granted on June 30, 2026, not in July. Epic's brief is due Nov 13, 2026, and Apple's reply is due Dec 14, 2026. https://www.macrumors.com/2026/06/30/apple-epic-games-supreme-court/ and https://ipwatchdog.com/2026/06/30/high-court-grants-cert-in-apples-challenge-to-ninth-circuit-contempt-ruling-in-app-store-dispute/
- 'Apple asked for up to 15%' leaves out the tiers that matter here. In the district court filing, Apple proposed 15% for standard apps but 5% for small-business developers, and 10% for renewals. A side project would fall in the 5% tier. This is still a proposal, not a rule. https://techcrunch.com/2026/08/14/apple-proposes-to-take-a-15-cut-of-purchases-made-outside-the-app-store/
- 'Empty Unity 6 web build is about 8 MB' is not precise. The default 3D URP template is 10.7 MB and the 2D BiRP template is 7.7 MB. Stripping can bring it down to about 2.0 MB Brotli-compressed. The '~100x heavier' framing still holds better for RAM (about 109 MB on BiRP and 219 MB on URP) than for download size. https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365 and https://discussions.unity.com/t/web-build-memory-consumption-on-unity-6/1613334
- The Apple 1.2 'hot-or-not' text sits under User-Generated Content. A game with fixed bundled hominin art and no UGC is not squarely covered by it. The bigger store risks are 1.1 ('creepy') and the June 2026 low-quality rules (see missed). https://developer.apple.com/app-store/review/guidelines/
- The cited 'Smash Or Pass: Group Games' precedent is weaker than presented. It is a text and scenario prompt deck ("characters, objects, or situations"), not image-based voting on human-like figures. Its last update was Aug 22, 2025, which is before the June 2026 guideline tightening. https://apps.apple.com/us/app/smash-or-pass-group-games/id6736897283
- Google Play's AI-Generated Content policy is aimed at apps that generate content at runtime from prompts, and it requires in-app reporting. Pre-generated portraits bundled with the app don't trigger it. Only the general sexual-content policy applies, so this risk is overstated. https://support.google.com/googleplay/android-developer/answer/13985936?hl=en
- On iOS, the PNG 'download fallback' must not be used inside an installed home-screen web app. Downloads (blob or Content-Disposition) open in Quick Look, which has no way back, and the user has to force-quit. On iOS always use navigator.share({files}). Keep the download only for Firefox and desktop. https://github.com/campfhir/renkei/pull/302 and https://github.com/chriswritescode-dev/opencode-manager/pull/353
- The other checked claims hold: Web Share files support at 93.32% with Firefox unsupported on desktop and Android (https://caniuse.com/mdn-api_navigator_share_data_files_parameter); iOS 26 opening any Home Screen site as a web app by default (https://mjtsai.com/blog/2025/10/03/web-apps-in-ios-26/); Unity Build Automation's free tier of 100 Mac minutes renewing monthly from Mar 1, 2026 (https://support.unity.com/hc/en-us/articles/34748492914964-Understanding-New-Unity-DevOps-charges-starting-from-Mar-1-2026); NativeShare archived on May 10, 2026 (https://github.com/yasirkula/UnityNativeShare); and Unity 6.7 making the Advanced Text Generator the runtime default with 10-40% CPU gains (https://discussions.unity.com/t/state-of-ui-toolkit-in-unity-6-7/1736756).

**Reviewer additions:**
- Apple's June 2026 guideline update explicitly names 'drinking game apps' (along with fart, burp and Kama Sutra apps) as 'mediocre, low-quality, or low-effort'. It also lets Apple remove apps in saturated categories that don't attract users or get updates, and repeated low-effort submissions can cost you the developer account. An adult party game fits that profile closely. This makes the web-first call stronger and makes the 'wrap in Capacitor later' step riskier than the finding says. https://www.macrumors.com/2026/06/09/app-store-guidelines-low-quality-apps/
- iOS keeps a home-screen web app's storage separate from Safari (https://webkit.org/tracking-prevention/). This has three effects. The service-worker precache and any localStorage unlock made in a Safari tab do NOT carry over to the installed app. The user must open the installed icon once while online to precache for offline play. An unlock bought in a Safari tab is stuck there, and Safari applies a 7-day cap on script-writable storage, so it can be wiped. Put install-then-unlock in the flow, and make unlock codes re-enterable.
- The finding never addresses the user's preference for 'an App'. It should say plainly that an installed iOS 26 or Android PWA looks and feels like an app (standalone, own icon, offline), so the user can judge whether that is close enough.
- Share-image detail: wait for document.fonts.ready and for the images to decode before drawing to the canvas. Otherwise the pre-rendered PNG can come out with fallback fonts or missing portraits.

**Sources:**
- https://caniuse.com/mdn-api_navigator_share_data_files_parameter
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
- https://web.dev/learn/pwa/os-integration/
- https://x.com/firt/status/1932167455016976853
- https://mjtsai.com/blog/2025/10/03/web-apps-in-ios-26/
- https://firt.dev/notes/pwa-ios/
- https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365
- https://discussions.unity.com/t/web-build-memory-consumption-on-unity-6/1613334
- https://discussions.unity.com/t/state-of-ui-toolkit-in-unity-6-7/1736756
- https://github.com/yasirkula/UnityNativeShare
- https://support.unity.com/hc/en-us/articles/34748492914964-Understanding-New-Unity-DevOps-charges-starting-from-Mar-1-2026
- https://www.cgchannel.com/2025/11/price-of-paid-unity-subscriptions-to-rise-but-free-subs-extended/
- https://docs.expo.dev/submit/ios/
- https://docs.expo.dev/tutorial/eas/ios-production-build/
- https://capgo.app/solutions/build-without-mac/
- https://capgo.app/blog/automatic-capacitor-ios-build-codemagic/
- https://developer.apple.com/app-store/review/guidelines/
- https://www.mactech.com/2026/02/06/apple-updates-its-app-review-guidelines-with-expanded-list-of-apps-with-objectionable-content/
- https://9to5mac.com/2025/07/24/apple-notifies-developers-of-new-app-store-age-rating-system/
- https://developer.apple.com/forums/thread/810473
- https://apps.apple.com/us/app/smash-or-pass-group-games/id6736897283
- https://techcrunch.com/2026/08/14/apple-proposes-to-take-a-15-cut-of-purchases-made-outside-the-app-store/
- https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy

## images

- **Model landscape (Oct 2026), all checked this session:**
  - **Nano Banana Pro (Gemini 3 Pro Image).** Up to 14 reference images and holds 5 people consistent. Google does not claim ownership of outputs. Every image carries an invisible SynthID watermark. The API is 18+ only, and on the free tier Google may use your prompts and outputs.
  - **GPT Image 2 (OpenAI, Apr 2026).** Up to 16 reference images and strong at following instructions. OpenAI's terms say you own the output and they assign their rights to you.
  - **Midjourney V8.2.** Best-looking results. `--sref` sets the style; the new edit model replaced `--oref`/`--cref` and takes up to 4 references. Any paid plan gives commercial rights while your company earns under $1M a year. Images are public by default; hiding them (Stealth) needs Pro or Mega.
  - **FLUX.2.** Pro/Flex via the API with 8-10 references. The open [dev] weights run locally on a 4090/5090 but carry a non-commercial licence. Its model page says outputs can be used commercially; check LICENSE.md before relying on that. The Klein variants are Apache 2.0.
  - **Ideogram 3.0.** Up to 3 style references plus a character reference. You can use outputs commercially.
- **Consistency comes from the workflow more than the model.** Lock one 'anchor' portrait first. Then make every other image from it: same style references, same prompt text with only the species slots changed, same framing and a plain backdrop. Generate each species' female and male as a pair. Reviewers report 85-95% consistency with reference-based methods versus much less from text alone.
- **Accuracy risk is real.** A 2026 study in Advances in Archaeological Practice found AI Neanderthal images match science from the late 1980s/early 1990s. Expect models to make the older species too ape-like or too modern, and to push the women towards a glamour look. Fix this by writing anatomy notes per species (Smithsonian Human Origins) and correcting by hand.
- **Do not use Kennis & Kennis or Gurche photos as image references, and do not name them in prompts.** Their rights page says you need their consent to reproduce their models. Use them only to inform your own written anatomy notes. For image references, use CC/public-domain images, or your own approved outputs once you have them.
- **Two style options:**
  - **(A) 'Prehistoric Picture Day'.** Photoreal school-yearbook portrait with a mottled blue studio backdrop. The joke is the photo format, not the subject.
  - **(B) 'Gallery Oil Portrait'.** A dignified formal oil painting with dark varnish and a lit face. The joke is the solemn treatment. It hides small accuracy errors and avoids the uncanny valley.
  - Both are chest-up, 3/4 view, with the head filling about 55% of a 4:5 frame, so they read at arm's length.
- **Reusable prompt template** (write every rule as a positive instruction, because Nano Banana and GPT Image have no negative prompts):
  `[STYLE BLOCK]. Chest-up portrait, three-quarter view, head fills upper 55% of a 4:5 frame, eyes at upper third, centred. Subject: an adult {sex} {species}, about 30 years old, an ordinary unretouched individual, scientifically based on current museum reconstructions. Anatomy: {height/build}, {cranium + brow ridge}, {face/jaw projection}, {nose}, {body hair}, {skin tone + hair, current evidence}. Wearing {plausible garment} that fully covers the chest and shoulders. Expression: {calm / mildly amused / patient}, mouth closed. Natural proportions, no makeup, no jewellery, no modern items. Match the lighting, colour grade and rendering of the reference images exactly.`
  - STYLE A: `1990s school picture-day portrait, mottled blue laser-swirl studio backdrop, soft frontal key light, slight film grain, photographic`
  - STYLE B: `formal 17th-century oil portrait, dark umber background, warm Rembrandt lighting on the face, visible brushwork, aged varnish`
  - Never put 'smash', 'pass', 'attractive', 'sexy' or 'nude' in a prompt, or any comparison to modern ethnic groups.
- **Store and legal position:**
  - **Apple.** The current review guidelines have no rule requiring a label on bundled AI content. They do ban 'overtly sexual' (1.1.4) and 'mean-spirited… national/ethnic origin' content (1.1.1).
  - **Google Play.** The AI-Generated Content policy explicitly excludes apps that only host AI content and cannot create it.
  - **EU AI Act.** Article 50(4) deepfake disclosure has applied since 2 Aug 2026. Reconstructions of extinct species are unlikely to count as deepfakes, and artistic/fictional works get a lighter duty anyway. A one-line credit covers it cheaply.
  - **US copyright.** The Copyright Office (Jan 2025) says prompts alone do not make you the author, so raw images may not be protectable. Human edits and your arrangement of them help.

**Recommendation:** **Use Nano Banana Pro (Gemini 3 Pro Image) as the main tool.** Pay for the API or AI Studio tier, since the free tier lets Google review and train on your prompts. Keep GPT Image 2 as the fallback when Gemini refuses or drifts. Use Midjourney V8.2 `--sref` only if you pick style B and want the extra polish. Do not fine-tune or train a LoRA for 20 images; reference images plus a locked prompt are enough. Expected cost is roughly 200-400 generations, which should stay well under $100 on either API. Check current per-image prices before you start.

**Steps:**
1. **Write a one-line anatomy card per species** (a field in your content data), based on Smithsonian Human Origins. Make skin, hair and body-hair choices from current evidence, and vary them. Do not map darker skin onto 'more ape-like' species: that recreates the racist 'march of progress' picture and puts you at risk under Apple 1.1.1.
2. **Prototype both styles on the two extremes:** Neanderthal and A. afarensis, female and male, so 8 images. Look at them at phone size and pick one style.
3. **Lock one anchor image** (Neanderthal male in the chosen style). Use it as the style reference for every later call, together with the previous approved pair.
4. **Generate each species' female and male together**, using the template with only the species slots changed.
5. **Finish by hand:** one crop and colour pass in an image editor, removing artefacts, and a check that clothing covers the chest. This also adds human authorship.
6. **Ship 1024x1280 WebP files** in the content folder. Add one line to the credits: 'Portraits are AI-generated artistic reconstructions, not scientific illustrations.'

**Other rules:**
- Keep the generated images as they are; do not try to strip SynthID or C2PA marks.
- If you use Midjourney, buy Pro/Stealth so the art is not public before launch.

**Risks:**
- Sexualisation drift: models push female portraits towards modern glamour looks or bare shoulders. Use 'ordinary unretouched individual', 'garment fully covers chest and shoulders' and 'no makeup', and reject any image that shows cleavage. A sexualised picture combined with 'smash' copy would hit Apple guideline 1.1.4.
- Refusals: the word 'female' next to hominin/prehistoric topics, any nudity-adjacent wording, or the game's 'smash' framing can trigger filters. Keep the game wording out of prompts entirely and describe clothing up front. Fall back to GPT Image 2 or Ideogram.
- Degrading caricature or racial-hierarchy reading: a march from dark, ape-like faces to a light-skinned sapiens repeats a racist trope. Base skin and hair on evidence, vary them, keep expressions dignified, and put the humour in the format (picture day or oil portrait) and the UI copy, never in mocking the faces.
- Scientific inaccuracy: a 2026 study found AI Neanderthal images reflect science from the late 1980s/early 1990s. Older species (Sahelanthropus, Ardipithecus, afarensis) will drift towards chimp-like or modern-human faces. Reviewing each image against written anatomy notes is mandatory.
- Copyright and style mimicry: using Kennis & Kennis or Gurche photos as references or naming them in prompts risks infringement and backlash from paleoartists. Their rights page requires consent to reproduce their models.
- Weak IP protection: under the US Copyright Office's Jan 2025 guidance, purely AI-generated images may not be copyrightable, so copycats could lift them. Human edits and your arrangement of them only partly help.
- Licence fine print: FLUX.2 [dev] weights are non-commercial, so check that the generated images are actually cleared before shipping them. Midjourney needs Pro/Mega once company revenue passes $1M a year, and images are public by default without Stealth. The Gemini API free tier allows human review and training on your inputs.
- Disclosure rules may tighten: Apple has no explicit AI-label rule today, and Play exempts apps that only host AI content. The EU AI Act Art. 50 has applied since Aug 2026. A one-line credit is cheap insurance; re-check at submission time.

**Reviewer corrections:**
- Gemini free-tier warning is partly moot. Nano Banana Pro has no free tier on the Gemini Developer API, so API use is always paid. Paid use means Google does not use prompts or outputs to improve its products; it only keeps limited logs for abuse checks. The training risk applies only to the free Gemini app or free AI Studio UI. 'Pay for the API or AI Studio tier' should read 'use a billing-enabled API key, not the free Gemini app or AI Studio UI'. Price is $0.134 per 1K/2K image, or $0.067 via Batch, so 200-400 generations cost about $27-54. Sources: https://pricepertoken.com/pricing-page/model/google-gemini-3-pro-image-preview, https://ai.google.dev/gemini-api/terms
- Reference limits are out of date. Current Gemini docs list Nano Banana Pro (gemini-3-pro-image) as taking up to 6 object images plus 5 character images, plus up to 3 style references. 'Up to 14' is the cross-model maximum, not a Pro figure. Source: https://ai.google.dev/gemini-api/docs/image-generation
- The landscape misses Nano Banana 2 (gemini-3.1-flash-image, 2026) and Nano Banana 2 Lite. Nano Banana 2 takes 10 object + 4 character + 3 style references and costs about $0.045-0.151 per image. It is a cheaper way to run the 8-image style prototype and iterate, keeping Pro for final renders. Sources: https://ai.google.dev/gemini-api/docs/image-generation, https://openrouter.ai/google/gemini-3.1-flash-image
- Ideogram 3.0 is no longer current. Ideogram 4.0 came out on 3 June 2026 as a 9.3B open-weight model under Apache 2.0, with output up to 2K. That makes it a commercially clean option to run locally on the user's GPU, unlike FLUX.2 [dev]. Sources: https://en.wikipedia.org/wiki/Ideogram_(text-to-image_model), https://morphic.com/resources/models/ideogram-4
- FLUX.2 Klein is not Apache 2.0 across the board. Klein 4B is Apache 2.0, but Klein 9B uses the FLUX.2 [dev] non-commercial licence. Sources: https://github.com/black-forest-labs/flux2, https://flami.pro/en/blog/flux-2-klein
- The accuracy study is described too strongly. Magnani & Clindaniel's paper in Advances in Archaeological Practice was published on 18 Dec 2025, not in 2026. It tested only DALL-E 3 (images) and GPT-3.5 (text). The 'late 1980s/early 1990s' finding is about DALL-E 3 specifically, not current models like Nano Banana Pro or GPT Image 2. The advice still holds: write anatomy notes and review every image by hand. Source: https://www.eurekalert.org/news-releases/1115630
- Midjourney: the V8.2 Edit Model opened for public testing on 27 Aug 2026 and is still a test feature. --oref still works on V7 and V8.1. The finding is right that the Edit Model takes up to 4 references. Sources: https://alphasignal.ai/news/midjourney-s-v8-2-edit-model-merges-inpainting-references-and-instructions-into, https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference

**Reviewer additions:**
- Apple guideline 1.2 bans 'objectification of real people (e.g. "hot-or-not" voting)'. Strictly it covers user-generated content, and these portraits are not real people. But smash/cutoff voting on photoreal faces will look like hot-or-not to a reviewer, which points towards the oil-portrait style (B) and an obviously fictional framing. Source: https://developer.apple.com/app-store/review/guidelines/
- Apple has dropped the 17+ rating. The tiers are now 4+/9+/13+/16+/18+, with a new required questionnaire since 31 Jan 2026. The project's '17+' target should become 16+ or 18+, and that choice decides how much innuendo the art and copy can carry. Source: https://techcrunch.com/2025/07/25/apple-broadens-app-stores-age-rating-system
- The EU AI Act claim checks out, with one detail missing. The Digital Omnibus (Reg. 2026/1744, in force 27 Jul 2026) did not delay Article 50. Only the Art. 50(2) machine-readable marking duty got a grace period to 2 Dec 2026, and only for systems on the market before Aug 2026. That duty falls on the model provider, not on an app that bundles images. Source: https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/
- GPT Image 2 cost is missing. Official pricing for a 1024x1536 portrait is about $0.041 at medium quality and $0.165 at high, with Batch at 50% off. That is comparable to Nano Banana Pro, so the 'under $100' estimate holds. Source: https://wavespeed.ai/blog/posts/gpt-image-2-pricing-2026/
- Gemini API terms bar using the Services in an app 'likely to be accessed by individuals under 18'. Bundling static images generated offline probably does not count as 'using the Services as part of' the app. Still, it means never adding runtime generation via Gemini to the shipped app later. Source: https://ai.google.dev/gemini-api/terms
- Midjourney carries extra legal risk from the open Disney/Universal copyright lawsuit, which is one more reason to keep it optional. Source: https://terms.law/2026/01/15/midjourney-commercial-use-rights-complete-2026-guide/

**Sources:**
- https://ai.google.dev/gemini-api/docs/image-generation
- https://blog.google/innovation-and-ai/technology/developers-tools/gemini-3-pro-image-developers/
- https://blog.google/innovation-and-ai/products/nano-banana-pro/
- https://ai.google.dev/gemini-api/terms
- https://openrouter.ai/openai/gpt-image-2
- https://wavespeed.ai/blog/posts/gpt-image-2-api-guide/
- https://www.versely.studio/blog/what-you-own-the-output-actually-means
- https://blakecrosley.com/guides/midjourney
- https://releasebot.io/updates/midjourney
- https://tech-insider.org/how-to-use-midjourney-v8-2-2026/
- https://docs.midjourney.com/hc/en-us/articles/32083055291277-Terms-of-Service
- https://terms.law/ai-output-rights/midjourney/
- https://huggingface.co/black-forest-labs/FLUX.2-dev
- https://github.com/black-forest-labs/flux2
- https://deepwiki.com/black-forest-labs/flux2/7.4-licensing-and-terms
- https://ideogram.ai/models/3.0/
- https://linocut.ai/blogs/multi-reference-ai-image-models/
- https://fast.io/resources/best-ai-character-generators-2026/
- https://www.kenniskennis.com/rights-licenses/
- https://archaeologymag.com/2026/02/study-of-ai-generated-neanderthal-scenes/
- https://www.eurekalert.org/news-releases/1115630
- https://developer.apple.com/app-store/review/guidelines/
- https://support.google.com/googleplay/android-developer/answer/14094294
- https://artificialintelligenceact.eu/transparency-rules-article-50/
- https://www.copyright.gov/ai/
- https://www.jonesday.com/en/insights/2025/02/copyrightability-of-ai-outputs-us-copyright-office-analyzes-human-authorship-requirement

## name: Will You Accept This Bone?

Risk: low

LOW risk. 'Will You Accept This Bone?' is 26 characters, so it fits the 30-character App Store and Play title limit. There are no app-store or product clashes. Warner Bros. abandoned its only filing on the source catchphrase in 2021 without registering it, and all six obvious domains (.com/.app/.gg, with and without 'will you') are unregistered. Keep 'Bachelor' and the show's branding out of the title, keywords and art, and it is a safe parody name. It is also safer than 'Too Hairy to Handle', because Netflix has registered its show title 'TOO HOT TO HANDLE' (at least in India) and Warner Bros. has no live mark on 'Will you accept this rose'. Not legal advice; a short knockout search by a trademark attorney before filing your own mark is still worth it.

- No app on the Apple App Store (iTunes Search API, terms 'accept this bone' and 'accept this rose') or Google Play ('No results for "will you accept this bone"') uses this name or a near-identical one. Only unrelated bone-anatomy and rose-themed apps came up.
- No game, board or card game, book, podcast or merch with this exact phrase showed up in web searches. The only near hit is a #acceptthisbone hashtag on a LinkedIn post tied to a shelter dog-adoption 'Poochelor' campaign. That is a one-off social post, not a brand.
- 'WILL YOU ACCEPT THIS ROSE?' was filed by Warner Bros. Entertainment Inc. (US serial 87728424, 2017-12-20) in Classes 9, 28 and 41 (game software, online games, casino/gaming). It is DEAD: abandoned on 2021-08-09 with no statement of use filed. It was never registered.
- Warner Bros. holds a LIVE registration for THE BACHELOR stylized logo (US Reg. 5995364, serial 88545969), covering TV entertainment and casino/electronic gaming. It also filed THE BACHELORETTE (serial 87728440) the same day as the rose phrase. So stay away from the words 'Bachelor' and 'Bachelorette', the ring-'O' logo, and the rose imagery, in the title and in store keywords.
- 'Will You Accept This Rose?' has already been used as a parody title with no visible pushback from Warner Bros.: an improv show at Under The Gun Theater in Chicago and a parody musical at the Hollywood Fringe Festival.
- No UK or EU mark for 'accept this rose' or 'accept this bone' turned up in web results. I could not query UKIPO or EUIPO directly, so this is unverified.
- Comparison with the other candidate: Netflix holds a registered 'TOO HOT TO HANDLE' mark, at least in India (Netflix Studios LLC, App. 4172082, registered until 2029). No existing 'Too Hairy to Handle' product turned up. The parent show's title for the Too Hot option is protected. The Bachelor catchphrase is not.

Parody: Warner Bros. never registered the catchphrase. It filed for it once, for games and casino use, then let the filing lapse in 2021, so there is no live trademark on the rose phrase. Changing 'rose' to 'bone' turns it into a clear pun, and an extinct-hominin smash-or-cutoff game is a long way from a TV dating show. Confusion is unlikely. One caveat: since Jack Daniel's v. VIP Products (US Supreme Court, 2023), a parody used as your own brand name gets no special First Amendment shield (no Rogers test). It is judged on plain likelihood of confusion, and here that analysis favours you. To keep it low-risk: no 'Bachelor', ABC or Warner names in the title, subtitle or store keywords; no rose ceremony, ring logo or show branding; and avoid copying the show's look (host podium, rose tray styling). Apple guideline 5.2 and Google's IP policy bite on brand names in metadata, not on a pun on a common phrase. The phrase is also widely parodied already (improv, musicals, shelter adoption campaigns), which weakens any claim that it belongs to one owner.

Domains: Checked live against the registries on 2026-10-04, and all six look unregistered. I tested the method on known domains first (google.com, google.app and google.gg all came back registered). willyouacceptthisbone.com: Verisign RDAP 404, unregistered. acceptthisbone.com: RDAP 404, unregistered. willyouacceptthisbone.app and acceptthisbone.app: Google Registry RDAP 404, unregistered. willyouacceptthisbone.gg and acceptthisbone.gg: whois.gg 'NOT FOUND', unregistered. I did not check whether any of them are premium-priced. Social handles (X, TikTok, Instagram) were not checked. Searches found no account using the phrase, but that is not proof the handles are free.

**Reviewer:**
- The LOW-risk verdict holds. I re-ran the checks on 2026-10-04 and got the same results. iTunes Search API for 'accept this bone' and 'will you accept this' returns only bone-anatomy apps or nothing. Google Play shows 'No results for "accept this bone"' (https://play.google.com/store/search?q=%22accept%20this%20bone%22&c=apps). Verisign RDAP returns 404 for willyouacceptthisbone.com and acceptthisbone.com, while the google.com control returns 200. Google Registry RDAP returns 404 for both .app names. I did not re-check the .gg names.
- The Too Hot to Handle comparison needs a softer claim. The Indian Netflix record (https://trademarking.in/details/Too-Hot-To-Handle-4172082.html) covers only a TV series and online video clips. It does not cover games. 'Too hot to handle' is also a common idiom. Netflix's mark does make 'Too Hairy to Handle' riskier, but only by a small margin. I found no US registration for it either way.
- 'No game, book, podcast or merch with this exact phrase' is accurate for the exact phrase. But the rose-to-bone swap itself is not new (see missed items). Do not describe the pun as original or distinctive. It is a known dog-parody joke, which also means no one owns it.
- Social handles are still unverified. Searches on TikTok, Instagram and Reddit found no account or viral post using the exact phrase. That is not proof the handles are free.
- Swapping bones for roses is a common dog joke in Bachelor parodies. Funny or Die's 'The Bachelor with Dogs' (2015, Scott Eastwood) used 'rawhide bones instead of roses' (https://www.bustle.com/articles/68027-the-bachelor-with-dogs-from-funny-or-die-8-other-bachelor-parodies-you-need-to, https://www.imdb.com/title/tt4519050/). Shelters run Bachelor-themed adoption events, such as Santa Fe Humane Society (https://www.krqe.com/news/animal-shelter-creates-bachelor-parody-to-help-adopt-dogs/) and Woods Humane 'Bachelor Pet' (https://www.noozhawk.com/a-new-season-of-bachelor-pet-returns-to-woods-humane-society/). This is no legal problem. The risk is to the brand: many people will read the title as a dog or pet joke rather than caveman or fossil bones. The subtitle and icon need to make the hominin angle obvious.
- 'Bone' is common slang for sex, so the title carries a sexual double meaning. That suits an 18+ smash-or-pass game, and searches found no porn or adult-site use of the exact phrase. Mild innuendo in a title is normal on 17+/Mature apps under Apple guideline 1.1.4 and Google Play's sexual-content policy. Just keep the screenshots and description free of anything explicit, so reviewers don't read the title literally.
- A live podcast called 'Will You Accept This Rose?' by Arden Myrin (https://podcasts.apple.com/us/podcast/will-you-accept-this-rose/id1073520842) uses 'BONE ZONE' as a running catchphrase. This is not a conflict. It is one more independent use of the rose catchphrase, which strengthens the finding that Warner does not control it. It also means a Bachelor-fan audience already links 'bone' jokes to that show.
- The only thing near this name in the USPTO search was an unrelated 'THE BONE' mark (https://trademark.justia.com/861/86/the-86186453.html). I found no live 'ACCEPT THIS BONE' or 'WILL YOU ACCEPT THIS ...' filing apart from Warner's dead rose application. A full USPTO search across Classes 9, 28 and 41 was not done.

## name: Too Hairy to Handle

Risk: low

LOW risk. No exact or near-identical use found in the app stores, the USPTO (via Trademarkia), web, merch, books or podcasts. Netflix's only US 'Too Hot to Handle' mark covers TV services (Class 41), and the phrase is a common idiom that other owners have registered too. The title changes the key word and reads as an obvious parody. The .com and .app domains, including the short toohairy.com, are unregistered. .gg is unverified. Keep it a clean parody: no Netflix or THTH logos, fonts or characters, and no 'Too Hot to Handle' in store keywords. UK/EU registers could not be searched directly, so run a quick UK IPO/EUIPO check before launch.

- No app, game, card or board game, book, podcast, merch item or trademark found using the exact phrase 'Too Hairy to Handle'. Checked web search, the iTunes Search API, a Google Play search and Trademarkia.
- Netflix Studios LLC holds US reg. TOO HOT TO HANDLE, serial 88451346, Class 41 only (unscripted TV series), live until 2030. Trademarkia shows no Netflix TOO HOT TO HANDLE filing in Class 9, 25 or 28. Netflix also has an Indian registration for the same phrase.
- Netflix publishes 'Too Hot To Handle 2/3 NETFLIX' and 'THTH: Love Is a Game NETFLIX' games on the App Store and Google Play (developer Nanobit). That puts the parody in the same storefront as the parent brand's own games. Proximity only; there is no shared word apart from the generic 'Too ... to Handle'.
- Other live US TOO HOT TO HANDLE marks show the phrase is a crowded common idiom: Aristocrat (85965563, Class 28, wagering gaming machines) and Ingram (76546694, Class 13, fireworks). IGT's Class 9 filing (77556952) is abandoned.
- Existing registered parody of the same title: TOO HOP'D TO HANDLE (TEAMCMO LLC, 86231534, Class 32 beer). It sits on the US register next to the Netflix mark.
- Nearby 'HAIRY' marks: HAIRY HAND (Class 28), HAIRY UP / HAIRYUP (Class 9), HAIRY DAWG and others. None share the phrase or its overall impression.
- UK IPO and EUIPO could not be checked directly (both returned 403). No UK or EU mark for 'too hairy to handle' turned up in web search. Fremantle/Talkback UK filings for 'Too Hot to Handle' are unverified.

Parody: The parody looks fine. 'Too hot to handle' is an old idiom: there are films from 1938, 1960 and 1977 and many songs and albums. Netflix's US registration covers only TV entertainment services (Class 41). Swapping 'Hot' for 'Hairy' changes the key word and makes the joke obvious, so a buyer is unlikely to think the game is a Netflix product. Parodies of the show are common and nothing turned up suggesting Netflix has gone after any of them: SNL's 2023 sketch, H&R Block's ad series, and Netflix's own horror-spoof trailer. TEAMCMO's 'Too Hop'd to Handle' beer even got registered. Remaining risk: (1) app-store adjacency to Netflix's THTH games; (2) copying trade dress. Do not use the THTH logo, typeface or neon look, the 'Lana' cone AI, or the phrase 'Too Hot to Handle' in store keywords or descriptions. Apple guideline 5.2 and Google's IP policy target names and keywords that use someone else's mark, and this title does not contain one. For the other candidate: Warner Bros. filed 'WILL YOU ACCEPT THIS ROSE?' (serial 87728424, Classes 9/28/41, games-of-chance software), but the filing was abandoned with no statement of use filed. So the Bachelor catchphrase is not a registered US mark.

Domains: Checked against the registry RDAP servers. The method was confirmed with known-registered domains first: google.com and cash.app both returned 200.
- toohairytohandle.com: unregistered (Verisign RDAP 404, DNS NXDOMAIN).
- toohairy.com: unregistered (Verisign RDAP 404).
- toohairytohandle.app: unregistered (Google Registry RDAP 404).
- toohairy.app: unregistered (Google Registry RDAP 404).
- toohairytohandle.gg: no DNS (NXDOMAIN), but registration is not verified. .gg has no working public RDAP (op.gg also returned 404) and whois was not available here. Check it at a registrar.
- toohairygame.com: no DNS.
Social handles (@toohairytohandle etc.) were not checked.
Length: 'Too Hairy to Handle' is 19 characters, under the 30-character App Store and Google Play title limits. That leaves 11 characters, enough for a short subtitle such as 'Too Hairy to Handle: 18+'.

**Reviewer:**
- The .gg domain is now confirmed free. A direct whois.gg port-43 query for toohairytohandle.gg returned 'NOT FOUND'. A control query for op.gg returned 'Status: Active, Registrant: OP.GG' in the same session.
- The UK/EU part is not simply 'unverified'. Justia's record for Netflix's US mark 88451346 (https://trademarks.justia.com/884/51/too-hot-to-88451346.html, as summarised in search results) points to an EU filing, EUIPO application 018062328, which most likely claims priority from the US mark. I could not find which classes it covers: EUIPO, TMview and UK IPO all returned 403 or reset the connection. It may go beyond Class 41 (for example Class 9 or 28 games), so check this specific number on EUIPO eSearch before launch. It should not change the verdict, because the parody does not reuse the distinctive word 'HOT'.
- I re-checked Trademarkia (https://www.trademarkia.com/search/trademarks?query=too%20hot%20to%20handle) and it matches the finding. There are 6 'TOO HOT TO HANDLE' filings. Netflix 88451346 is the only Netflix one, Class 41, live until 2030. The others are Aristocrat 85965563 (Class 28, live), Ingram 76546694 (Class 13, live), IGT 77556952 (Class 9, abandoned), Casa de Marka 97746369 (Class 3, abandoned) and Balsley 73232992 (Class 42, cancelled).
- Social handles, which the finding did not check. YouTube @toohairytohandle returns 404, so it is free (https://www.youtube.com/@toohairytohandle). The TikTok @toohairytohandle page returns statusCode 10221 (user not found), while the @netflix control returns statusCode 0, so it is likely free. X/Twitter returned 404, so probably free, but this is less reliable while logged out. Instagram returns 200 for any path, so I could not tell. Reddit returned 403. Reserve all of them now.
- Adult/SEO risk the finding did not cover. 'Hairy' is an established porn niche: there are commercial porn series such as 'ATK Natural & Hairy' and 'Horny Hairy Girls' listed on IMDb Pro (https://pro.imdb.com/title/tt38283497, https://pro.imdb.com/title/tt2825512/news), and spam pages about 'hairy' porn rank in searches. I found no porn title using the exact phrase 'Too Hairy to Handle'. Still, an 18+ title that pairs 'hairy' with sexual voting may draw closer review under Apple guideline 1.1.4 (overtly sexual content) and Google's sexual-content policy. Web searches for the name may also surface adult results. Keep store art and copy clearly comedic and paleo-themed, not sexual.
- The phrase may already be in light social use. A web search for 'toohairytohandle' surfaced a #toohairytohandle hashtag mention on X (https://twitter.com/hashtag/trashtags), but I could not open it to confirm. It is an informal joke hashtag, not a brand, so it does not conflict, but the name is not completely unused.
- I re-ran the store searches and found no exact or near match. The iTunes Search API for 'too hairy' (https://itunes.apple.com/search?term=too%20hairy&entity=software&country=us&limit=50) and the Google Play search (https://play.google.com/store/search?q=too%20hairy%20to%20handle&c=apps) return only grooming and hairstyle apps (Shave Me!, Hairy Face Makeover Salon, Hairy - Men Hairstyles). That supports the 'no conflict' result. In the US App Store the name also does not collide with the Netflix THTH listings.
