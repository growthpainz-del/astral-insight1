import AIWorkspace from './pages/AIWorkspace';
import AdminDeckReview from './pages/AdminDeckReview';
import AdminTokenGrant from './pages/AdminTokenGrant';
import AdminUsers from './pages/AdminUsers';
import CardGallery from './pages/CardGallery';
import CardInfo from './pages/CardInfo';
import CardNames from './pages/CardNames';
import CreateDeck from './pages/CreateDeck';
import Dashboard from './pages/Dashboard';
import Deck from './pages/Deck';
import DeckCreationWizard from './pages/DeckCreationWizard';
import DeckGallery from './pages/DeckGallery';
import DeckView from './pages/DeckView';
import Explore from './pages/Explore';
import FusionBuilder from './pages/FusionBuilder';
import FusionManager from './pages/FusionManager';
import FusionReading from './pages/FusionReading';
import FusionRecipeEditor from './pages/FusionRecipeEditor';
import Fusions from './pages/Fusions';
import Help from './pages/Help';
import History from './pages/History';
import Home from './pages/Home';
import Journal from './pages/Journal';
import ManualsLibrary from './pages/ManualsLibrary';
import MyFusions from './pages/MyFusions';
import Persona from './pages/Persona';
import PhotoUploader from './pages/PhotoUploader';
import Reading from './pages/Reading';
import ReadingRoom from './pages/ReadingRoom';
import ReadingSimple from './pages/ReadingSimple';
import Rebel8Ball from './pages/Rebel8Ball';
import SharedReading from './pages/SharedReading';
import SpreadCleaner from './pages/SpreadCleaner';
import SpreadDesigner from './pages/SpreadDesigner';
import SpreadManager from './pages/SpreadManager';
import SpreadSeeder from './pages/SpreadSeeder';
import Studio from './pages/Studio';
import SubscriptionManagement from './pages/SubscriptionManagement';
import Upgrade from './pages/Upgrade';
import UserProfile from './pages/UserProfile';
import WebhookTester from './pages/WebhookTester';
import WiccanSeeder from './pages/WiccanSeeder';
import ZodiacReading from './pages/ZodiacReading';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIWorkspace": AIWorkspace,
    "AdminDeckReview": AdminDeckReview,
    "AdminTokenGrant": AdminTokenGrant,
    "AdminUsers": AdminUsers,
    "CardGallery": CardGallery,
    "CardInfo": CardInfo,
    "CardNames": CardNames,
    "CreateDeck": CreateDeck,
    "Dashboard": Dashboard,
    "Deck": Deck,
    "DeckCreationWizard": DeckCreationWizard,
    "DeckGallery": DeckGallery,
    "DeckView": DeckView,
    "Explore": Explore,
    "FusionBuilder": FusionBuilder,
    "FusionManager": FusionManager,
    "FusionReading": FusionReading,
    "FusionRecipeEditor": FusionRecipeEditor,
    "Fusions": Fusions,
    "Help": Help,
    "History": History,
    "Home": Home,
    "Journal": Journal,
    "ManualsLibrary": ManualsLibrary,
    "MyFusions": MyFusions,
    "Persona": Persona,
    "PhotoUploader": PhotoUploader,
    "Reading": Reading,
    "ReadingRoom": ReadingRoom,
    "ReadingSimple": ReadingSimple,
    "Rebel8Ball": Rebel8Ball,
    "SharedReading": SharedReading,
    "SpreadCleaner": SpreadCleaner,
    "SpreadDesigner": SpreadDesigner,
    "SpreadManager": SpreadManager,
    "SpreadSeeder": SpreadSeeder,
    "Studio": Studio,
    "SubscriptionManagement": SubscriptionManagement,
    "Upgrade": Upgrade,
    "UserProfile": UserProfile,
    "WebhookTester": WebhookTester,
    "WiccanSeeder": WiccanSeeder,
    "ZodiacReading": ZodiacReading,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};