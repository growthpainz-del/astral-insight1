import Dashboard from './pages/Dashboard';
import CreateDeck from './pages/CreateDeck';
import History from './pages/History';
import Help from './pages/Help';
import Upgrade from './pages/Upgrade';
import AdminUsers from './pages/AdminUsers';
import SpreadManager from './pages/SpreadManager';
import ZodiacReading from './pages/ZodiacReading';
import CardGallery from './pages/CardGallery';
import FusionReading from './pages/FusionReading';
import Rebel8Ball from './pages/Rebel8Ball';
import DeckCreationWizard from './pages/DeckCreationWizard';
import Home from './pages/Home';
import ManualsLibrary from './pages/ManualsLibrary';
import PhotoUploader from './pages/PhotoUploader';
import DeckView from './pages/DeckView';
import WiccanSeeder from './pages/WiccanSeeder';
import FusionManager from './pages/FusionManager';
import Persona from './pages/Persona';
import SpreadDesigner from './pages/SpreadDesigner';
import FusionRecipeEditor from './pages/FusionRecipeEditor';
import MyFusions from './pages/MyFusions';
import CardNames from './pages/CardNames';
import Deck from './pages/Deck';
import DeckGallery from './pages/DeckGallery';
import CardInfo from './pages/CardInfo';
import SpreadCleaner from './pages/SpreadCleaner';
import FusionBuilder from './pages/FusionBuilder';
import Fusions from './pages/Fusions';
import SubscriptionManagement from './pages/SubscriptionManagement';
import WebhookTester from './pages/WebhookTester';
import AdminTokenGrant from './pages/AdminTokenGrant';
import AdminDeckReview from './pages/AdminDeckReview';
import SpreadSeeder from './pages/SpreadSeeder';
import Explore from './pages/Explore';
import UserProfile from './pages/UserProfile';
import ReadingRoom from './pages/ReadingRoom';
import Studio from './pages/Studio';
import ReadingSimple from './pages/ReadingSimple';
import Reading from './pages/Reading';
import Journal from './pages/Journal';
import AIWorkspace from './pages/AIWorkspace';
import SharedReading from './pages/SharedReading';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "CreateDeck": CreateDeck,
    "History": History,
    "Help": Help,
    "Upgrade": Upgrade,
    "AdminUsers": AdminUsers,
    "SpreadManager": SpreadManager,
    "ZodiacReading": ZodiacReading,
    "CardGallery": CardGallery,
    "FusionReading": FusionReading,
    "Rebel8Ball": Rebel8Ball,
    "DeckCreationWizard": DeckCreationWizard,
    "Home": Home,
    "ManualsLibrary": ManualsLibrary,
    "PhotoUploader": PhotoUploader,
    "DeckView": DeckView,
    "WiccanSeeder": WiccanSeeder,
    "FusionManager": FusionManager,
    "Persona": Persona,
    "SpreadDesigner": SpreadDesigner,
    "FusionRecipeEditor": FusionRecipeEditor,
    "MyFusions": MyFusions,
    "CardNames": CardNames,
    "Deck": Deck,
    "DeckGallery": DeckGallery,
    "CardInfo": CardInfo,
    "SpreadCleaner": SpreadCleaner,
    "FusionBuilder": FusionBuilder,
    "Fusions": Fusions,
    "SubscriptionManagement": SubscriptionManagement,
    "WebhookTester": WebhookTester,
    "AdminTokenGrant": AdminTokenGrant,
    "AdminDeckReview": AdminDeckReview,
    "SpreadSeeder": SpreadSeeder,
    "Explore": Explore,
    "UserProfile": UserProfile,
    "ReadingRoom": ReadingRoom,
    "Studio": Studio,
    "ReadingSimple": ReadingSimple,
    "Reading": Reading,
    "Journal": Journal,
    "AIWorkspace": AIWorkspace,
    "SharedReading": SharedReading,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};