import React from "react";
import { useNavigate } from "react-router-dom";
import { Deck } from "@/entities/Deck";
import { Card } from "@/entities/Card";
import { createPageUrl } from "@/utils";

const RAW_DATA = [
  { number: 1, title: "AGNES", subtitle: "Embrace daily rituals for inner peace, with reverse warning against chaos from ignored routines.", upright: "Embrace daily rituals for inner peace.", reverse: "Ignore routines, lose magic in chaos.", custom_notes: "In Hestia’s hearth, flames whisper secrets, grounding whimsy in eternal glow.", keywords: ["rituals","peace","daily","magic","grounding","whimsy"] },
  { number: 2, title: "ALICE", subtitle: "Find magic in simple chores, with reverse highlighting disconnection from overlooked wonders.", upright: "Find magic in simple chores.", reverse: "Overlook daily wonders, feel disconnected.", custom_notes: "Celtic druids weave spells through twilight mists, in humble tasks the old gods persist.", keywords: ["magic","chores","wonders","connection","humble","spells"] },
  { number: 3, title: "ANN", subtitle: "Ground whimsy in routine tasks, with reverse scattering flighty ideas without foundation.", upright: "Ground whimsy in routine tasks.", reverse: "Flighty ideas scatter without foundation.", custom_notes: "Egyptian scribes etch stars on papyrus scrolls, daily symbols birthing cosmic souls.", keywords: ["whimsy","routine","foundation","symbols","cosmic","ground"] },
  { number: 4, title: "ANNE", subtitle: "Infuse hearth with enchanted energy, with reverse leaving home empty without ritual spark.", upright: "Infuse hearth with enchanted energy.", reverse: "Home feels empty without ritual spark.", custom_notes: "Norse runes guard the threshold’s gleam, warding shadows in fire’s dream.", keywords: ["hearth","energy","ritual","home","runes","fire"] },
  { number: 5, title: "ABIGAIL", subtitle: "Seek wisdom in everyday signs, with reverse missing omens and stumbling blindly.", upright: "Seek wisdom in everyday signs.", reverse: "Miss omens, stumble blindly.", custom_notes: "Greek oracles breathe fates in wind’s sigh, portents blooming where mortals lie.", keywords: ["wisdom","signs","omens","fates","portents","intuition"] },
  { number: 6, title: "BRIDGET", subtitle: "Nurture home as sacred space, with reverse neglecting sanctuary and inviting discord.", upright: "Nurture home as sacred space.", reverse: "Neglect sanctuary, invite discord.", custom_notes: "Babylonian fires dance in clay-bound rite, harmony born from embers’ light.", keywords: ["nurture","sacred","sanctuary","harmony","embers","rite"] },
  { number: 7, title: "ELLEN", subtitle: "Blend intuition with daily flow, with reverse drowning intuition in routine drudgery.", upright: "Blend intuition with daily flow.", reverse: "Intuition drowned by routine drudgery.", custom_notes: "Shamanic drums echo in earth’s vein, visions flowering in the mundane rain.", keywords: ["intuition","flow","visions","mundane","shamanic","echo"] },
  { number: 8, title: "FLORENCE", subtitle: "Discover spells in mundane acts, with reverse blinding to hidden potentials.", upright: "Discover spells in mundane acts.", reverse: "Mundane blinds to hidden potentials.", custom_notes: "Alchemists’ vials transmute lead to gold, in daily dross, secrets unfold.", keywords: ["spells","mundane","potentials","transmute","secrets","alchemy"] },
  { number: 9, title: "GRACE", subtitle: "Harmonize life with subtle magic, with reverse blocking flow from disharmony.", upright: "Harmonize life with subtle magic.", reverse: "Disharmony blocks magical flow.", custom_notes: "Tao’s river carves through stone’s embrace, cycles whispering in silent grace.", keywords: ["harmonize","magic","flow","cycles","grace","balance"] },
  { number: 10, title: "HELEN", subtitle: "Unveil mysteries in ordinary moments, with reverse veiling mysteries in distraction.", upright: "Unveil mysteries in ordinary moments.", reverse: "Mysteries remain veiled in distraction.", custom_notes: "Eleusinian veils part in harvest’s hush, insights blooming in Demeter’s blush.", keywords: ["mysteries","moments","insights","veils","harvest","blooming"] },
  { number: 11, title: "ISOBEL", subtitle: "Harness hidden passions calmly, with reverse erupting passions uncontrollably.", upright: "Harness hidden passions calmly.", reverse: "Passions erupt uncontrollably.", custom_notes: "Thor’s hammer slumbers in storm’s soft veil, thunder’s whisper before the gale.", keywords: ["passions","calm","harness","storm","thunder","veil"] },
  { number: 12, title: "JOAN", subtitle: "Transform upheaval into quiet power, with reverse overwhelming without control.", upright: "Transform upheaval into quiet power.", reverse: "Upheaval overwhelms without control.", custom_notes: "Phoenix rises from ash’s silent bed, rebirth’s flame in embers spread.", keywords: ["transform","upheaval","power","rebirth","flame","embers"] },
  { number: 13, title: "JANE", subtitle: "Mask intensity with serene facade, with reverse cracking facade to expose raw intensity.", upright: "Mask intensity with serene facade.", reverse: "Facade cracks, intensity exposed raw.", custom_notes: "Medusa’s eyes in stone’s cold stare, hidden power beyond compare.", keywords: ["intensity","facade","serene","power","hidden","stare"] },
  { number: 14, title: "KATHERINE", subtitle: "Channel storm energy inwardly, with reverse scattering energy chaotically outward.", upright: "Channel storm energy inwardly.", reverse: "Energy scatters outward chaotically.", custom_notes: "Indra’s bolts in monsoon skies entwine, controlled fury in rain divine.", keywords: ["energy","channel","storm","fury","rain","control"] },
  { number: 15, title: "KATHARINA", subtitle: "Subvert calm with fierce change, with reverse stalling change in false serenity.", upright: "Subvert calm with fierce change.", reverse: "Change stalls in false serenity.", custom_notes: "Loki’s grin twists fate’s quiet thread, disruption blooming where peace had bred.", keywords: ["change","fierce","subvert","disruption","fate","peace"] },
  { number: 16, title: "MALIN", subtitle: "Conceal turmoil for strategic release, with reverse leaking turmoil prematurely.", upright: "Conceal turmoil for strategic release.", reverse: "Turmoil leaks prematurely.", custom_notes: "Typhon’s wrath coils in earth’s deep core, awaiting the moment to roar once more.", keywords: ["turmoil","conceal","release","wrath","core","roar"] },
  { number: 17, title: "MARIE", subtitle: "Balance serenity and inner fury, with reverse tipping to rage or apathy.", upright: "Balance serenity and inner fury.", reverse: "Imbalance tips to rage or apathy.", custom_notes: "Sekhmet’s lioness tamed by beer’s sweet flow, fury healed in Nile’s glow.", keywords: ["balance","serenity","fury","healed","lioness","flow"] },
  { number: 18, title: "MARTHA", subtitle: "Unleash passion from subtle depths, with reverse locking depths and dormant passion.", upright: "Unleash passion from subtle depths.", reverse: "Depths remain locked, passion dormant.", custom_notes: "Pele’s volcanic subtlety in Hawaiian lore, lava’s quiet surge from ocean’s shore.", keywords: ["passion","depths","unleash","volcanic","surge","lore"] },
  { number: 19, title: "MARY", subtitle: "Navigate storms with veiled strength, with reverse overwhelming veiled defenses.", upright: "Navigate storms with veiled strength.", reverse: "Storms overwhelm veiled defenses.", custom_notes: "Tiamat’s chaotic depths in Babylonian night, birthing worlds from watery might.", keywords: ["storms","strength","veiled","chaotic","birthing","depths"] },
  { number: 20, title: "MARGARET", subtitle: "Erupt transformatively from quiet, with reverse fizzling eruption without buildup.", upright: "Erupt transformatively from quiet.", reverse: "Eruption fizzles without buildup.", custom_notes: "Kali’s dance whirls destruction’s art, renewal’s seed in beating heart.", keywords: ["erupt","transform","quiet","destruction","renewal","dance"] },
  { number: 21, title: "MOLL", subtitle: "Wander roots to new welcomes, with reverse isolating wandering from roots.", upright: "Wander roots to new welcomes.", reverse: "Wandering isolates from roots.", custom_notes: "Hermes’ sandals fleet across divine bounds, bridging realms where friendship abounds.", keywords: ["wander","roots","welcomes","bridging","realms","friendship"] },
  { number: 22, title: "MERGA", subtitle: "Bridge homes across adventures, with reverse severing home ties in adventures.", upright: "Bridge homes across adventures.", reverse: "Adventures sever home ties.", custom_notes: "Odin’s eye wanders Yggdrasil’s span, wisdom gleaned in foreign lands.", keywords: ["bridge","homes","adventures","wisdom","wander","lands"] },
  { number: 23, title: "PETRONILLA", subtitle: "Make anywhere feel familiar, with reverse making everywhere feel alien.", upright: "Make anywhere feel familiar.", reverse: "Everywhere feels alien.", custom_notes: "Hestia’s flame travels in nomad’s heart, hearth kindled where journeys start.", keywords: ["familiar","anywhere","alien","flame","hearth","journeys"] },
  { number: 24, title: "REBECCA", subtitle: "Travel with grounded connections, with reverse uprooting connections in travel.", upright: "Travel with grounded connections.", reverse: "Travel uproots connections.", custom_notes: "Abraham’s tents pitch under starlit skies, faith’s nomadic ties that never die.", keywords: ["travel","connections","grounded","faith","nomadic","ties"] },
  { number: 25, title: "SARAH", subtitle: "Explore while honoring origins, with reverse forgetting origins in exploration.", upright: "Explore while honoring origins.", reverse: "Exploration forgets origins.", custom_notes: "Inanna descends to underworld’s gate, returning with roots that elevate.", keywords: ["explore","origins","honoring","descend","roots","elevate"] },
  { number: 26, title: "SUSANNAH", subtitle: "Invite warmth in nomadic paths, with reverse growing cold paths without warmth.", upright: "Invite warmth in nomadic paths.", reverse: "Paths grow cold without warmth.", custom_notes: "Coyote’s paws tread trickster’s trail, warmth woven in tale after tale.", keywords: ["warmth","nomadic","paths","trickster","trail","woven"] },
  { number: 27, title: "SYBIL", subtitle: "Cross realms with welcoming spirit, with reverse dividing realms without spirit.", upright: "Cross realms with welcoming spirit.", reverse: "Realms divide without spirit.", custom_notes: "Sibyls’ voices echo through Apollo’s shrine, prophetic bridges in time’s design.", keywords: ["realms","spirit","welcoming","prophetic","bridges","echo"] },
  { number: 28, title: "TEMPERANCE", subtitle: "Balance journey and home ties, with reverse stranding in limbo from imbalance.", upright: "Balance journey and home ties.", reverse: "Imbalance strands in limbo.", custom_notes: "Anubis weighs hearts on desert sands, guiding souls to balanced lands.", keywords: ["balance","journey","ties","guiding","souls","weighs"] },
  { number: 29, title: "TITUBA", subtitle: "Fuse folklore in wandering ways, with reverse losing folklore in wanderlust.", upright: "Fuse folklore in wandering ways.", reverse: "Folklore lost in wanderlust.", custom_notes: "Diaspora spirits sail on ocean’s tide, folklore fused where cultures collide.", keywords: ["folklore","wandering","fuse","spirits","cultures","tide"] },
  { number: 30, title: "URSULA", subtitle: "Protect travels with neighborly vibe, with reverse leaving travels vulnerable without protection.", upright: "Protect travels with neighborly vibe.", reverse: "Travels vulnerable without protection.", custom_notes: "Artemis’ arrows guard the moonlit wood, sisterhood’s shield where wanderers stood.", keywords: ["protect","travels","vibe","guard","shield","sisterhood"] },
  { number: 31, title: "WILMOT", subtitle: "Reflect ideas into fresh inventions, with reverse staling reflections without innovation.", upright: "Reflect ideas into fresh inventions.", reverse: "Reflections stale, no innovation.", custom_notes: "Prometheus’ spark stolen from heaven’s fire, echoed in humanity’s desire.", keywords: ["reflect","ideas","inventions","spark","fire","desire"] },
  { number: 32, title: "ALIZON", subtitle: "Transform echoes creatively, with reverse repeating echoes without change.", upright: "Transform echoes creatively.", reverse: "Echoes repeat without change.", custom_notes: "Echo’s voice lingers in mountain’s call, metamorphosed in Ovid’s thrall.", keywords: ["transform","echoes","creatively","voice","metamorphosed","lingers"] },
  { number: 33, title: "ELIZABETH", subtitle: "Innovate from familiar reflections, with reverse blocking new ideas from familiarity.", upright: "Innovate from familiar reflections.", reverse: "Familiarity blocks new ideas.", custom_notes: "Athena’s shield mirrors Gorgon’s dread, innovation born from reflected thread.", keywords: ["innovate","reflections","familiar","shield","mirrors","born"] },
  { number: 34, title: "GEILLIS", subtitle: "Mirror concepts into novel spells, with reverse distorting mirrors without clarity.", upright: "Mirror concepts into novel spells.", reverse: "Mirrors distort without clarity.", custom_notes: "Scrying pools ripple with seer’s gaze, ancient divinations in glassy haze.", keywords: ["mirror","concepts","spells","scrying","divinations","gaze"] },
  { number: 35, title: "DEMDIKE", subtitle: "Craft new from old echoes, with reverse trapping in repetition from old echoes.", upright: "Craft new from old echoes.", reverse: "Old echoes trap in repetition.", custom_notes: "Mnemosyne’s waters flow through muse’s song, echoes crafting where memories belong.", keywords: ["craft","echoes","old","waters","muse","memories"] },
  { number: 36, title: "CHATTOX", subtitle: "Invent by echoing nature’s wisdom, with reverse failing invention by ignoring nature’s echo.", upright: "Invent by echoing nature’s wisdom.", reverse: "Nature’s echo ignored, invention fails.", custom_notes: "Druid oaks whisper in wind’s embrace, nature’s echoes in sacred space.", keywords: ["invent","echoing","wisdom","whisper","sacred","nature"] },
  { number: 37, title: "JENNET", subtitle: "Spark creation from mirrored thoughts, with reverse mirroring thoughts endlessly without spark.", upright: "Spark creation from mirrored thoughts.", reverse: "Thoughts mirror endlessly, no spark.", custom_notes: "Vedic rishis chant creation’s hymn, echoes birthing cosmos’ whim.", keywords: ["spark","creation","thoughts","chant","birthing","cosmos"] },
  { number: 38, title: "LAURIE", subtitle: "Evolve ideas through inventive echo, with reverse echoing evolution back to start.", upright: "Evolve ideas through inventive echo.", reverse: "Evolution echoes back to start.", custom_notes: "Myths of evolution in ancient seas, echoed in life’s branching trees.", keywords: ["evolve","ideas","echo","myths","branching","life"] },
  { number: 39, title: "MALIN", subtitle: "Blend reflections for original magic, with reverse muddling blends into confusion.", upright: "Blend reflections for original magic.", reverse: "Blends muddle into confusion.", custom_notes: "Alchemical fires distill essence pure, reflections blended in elixir’s lure.", keywords: ["blend","reflections","magic","distill","elixir","essence"] },
  { number: 40, title: "MEDEA", subtitle: "Innovate boldly from echoed lore, with reverse blocking bold from echoed lore fear.", upright: "Innovate boldly from echoed lore.", reverse: "Lore echoes fear, bold blocked.", custom_notes: "Medea’s cauldron boils in moon’s pale light, echoed lore in sorceress’ flight.", keywords: ["innovate","boldly","lore","cauldron","sorceress","flight"] },
  { number: 41, title: "MORGAN", subtitle: "Lead change from hidden depths, with reverse stalling change in hidden depths.", upright: "Lead change from hidden depths.", reverse: "Depths hide, change stalls.", custom_notes: "Morgan le Fay weaves Avalon’s mist, veiled enchantments in Arthur’s twist.", keywords: ["lead","change","depths","weaves","enchantments","veiled"] },
  { number: 42, title: "CIRCE", subtitle: "Guide quietly with transformative power, with reverse veiling truth in transformation.", upright: "Guide quietly with transformative power.", reverse: "Transformation veils truth.", custom_notes: "Circe’s herbs brew on Aeaea’s shore, quiet guidance in Odyssey’s lore.", keywords: ["guide","transformative","power","herbs","guidance","lore"] },
  { number: 43, title: "HECATE", subtitle: "Pioneer shadows into new paths, with reverse consuming paths in shadows.", upright: "Pioneer shadows into new paths.", reverse: "Shadows consume paths.", custom_notes: "Hecate’s torches light crossroads’ night, pioneering veils in triple sight.", keywords: ["pioneer","shadows","paths","torches","crossroads","veils"] },
  { number: 44, title: "BABA", subtitle: "Drive progress in veiled wisdom, with reverse losing progress in too deep veiled wisdom.", upright: "Drive progress in veiled wisdom.", reverse: "Wisdom veiled too deep, progress lost.", custom_notes: "Baba Yaga’s hut spins on chicken’s leg, Slavic wisdom in riddles beg.", keywords: ["drive","progress","wisdom","hut","riddles","Slavic"] },
  { number: 45, title: "ELSPETH", subtitle: "Integrate change from the unseen, with reverse isolating integration in unseen.", upright: "Integrate change from the unseen.", reverse: "Unseen isolates integration.", custom_notes: "Cunning folk’s charms in Highland glen, unseen arts where changes begin.", keywords: ["integrate","change","unseen","charms","arts","cunning"] },
  { number: 46, title: "AMY", subtitle: "Shadow-lead with balanced force, with reverse imbalancing force in shadows.", upright: "Shadow-lead with balanced force.", reverse: "Force imbalances in shadows.", custom_notes: "Lilith’s wings unfold in Eden’s shade, shadowed power unafraid.", keywords: ["shadow","lead","force","wings","power","shade"] },
  { number: 47, title: "KATE", subtitle: "Vanguard quietly against norms, with reverse veiling quiet rebellion in norms.", upright: "Vanguard quietly against norms.", reverse: "Norms veil quiet rebellion.", custom_notes: "Kate Crackernuts cracks fairy spells, quiet vanguard where magic dwells.", keywords: ["vanguard","quietly","norms","cracks","spells","magic"] },
  { number: 48, title: "PETRONILLA", subtitle: "Push evolution from obscurity, with reverse burying evolution in obscurity.", upright: "Push evolution from obscurity.", reverse: "Obscurity buries evolution.", custom_notes: "Herbalists’ grimoires in candle’s flicker, veiled evolution growing thicker.", keywords: ["push","evolution","obscurity","grimoires","veiled","flicker"] },
  { number: 49, title: "REBECCA", subtitle: "Champion shifts in silence, with reverse muffling shifts in silence.", upright: "Champion shifts in silence.", reverse: "Silence muffles shifts.", custom_notes: "Rebecca’s well quenches nomadic thirst, silent shifts in blessings first.", keywords: ["champion","shifts","silence","well","blessings","nomadic"] },
  { number: 50, title: "SARAH", subtitle: "Forge ahead veiled in mystery, with reverse veiling progress in mystery.", upright: "Forge ahead veiled in mystery.", reverse: "Mystery veils progress.", custom_notes: "Sarah’s laughter echoes promise’s seed, mystery forging in ancient creed.", keywords: ["forge","veiled","mystery","laughter","promise","creed"] }
];

export default function WiccanSeeder() {
  const navigate = useNavigate();
  const [status, setStatus] = React.useState("Preparing import…");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const run = async () => {
      try {
        setStatus("Checking for existing deck…");
        const exist = await Deck.filter({ name: "Wiccan Woman Oracle Deck" });
        let deck = exist && exist.length ? exist[0] : null;

        if (!deck) {
          setStatus("Creating deck…");
          deck = await Deck.create({
            name: "Wiccan Woman Oracle Deck",
            category: "oracle",
            is_public: true
          });
        }

        setStatus("Preparing cards…");
        const cards = RAW_DATA.map((d) => ({
          deck_id: deck.id,
          name: d.title,
          number: d.number,
          subtitle: d.subtitle,
          overall_meaning: d.subtitle, // also store in overall_meaning for reading UIs
          upright_meaning: d.upright,
          reversed_meaning: d.reverse,
          custom: d.custom_notes,
          keywords: Array.isArray(d.keywords) ? d.keywords : []
        }));

        setStatus(`Creating ${cards.length} cards…`);
        await Card.bulkCreate(cards);

        setStatus("Done! Redirecting…");
        navigate(createPageUrl(`DeckView?id=${deck.id}`), { replace: true });
      } catch (e) {
        setError(e.message || "Import failed.");
        setStatus("An error occurred.");
      }
    };
    run();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-md w-full text-center">
        {!error ? (
          <>
            <div className="mx-auto mb-4 w-8 h-8 rounded-full border-2 border-white/30 border-t-transparent animate-spin" />
            <h1 className="text-xl font-semibold">Wiccan Woman Oracle Deck</h1>
            <p className="text-white/80 mt-2">{status}</p>
            <p className="text-xs text-white/60 mt-4">This runs once; afterwards you’ll be taken to the deck.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-red-300">Import Error</h1>
            <p className="text-white/80 mt-2">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}