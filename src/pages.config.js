/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Account from './pages/Account';
import AdminDeckReview from './pages/AdminDeckReview';
import AdminTokenGrant from './pages/AdminTokenGrant';
import AdminUsers from './pages/AdminUsers';
import AstralTest from './pages/AstralTest';
import CardGallery from './pages/CardGallery';
import CardInfo from './pages/CardInfo';
import CardNames from './pages/CardNames';
import CreateDeck from './pages/CreateDeck';
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
import Journal from './pages/Journal';
import ManualsLibrary from './pages/ManualsLibrary';
import MyFusions from './pages/MyFusions';
import Persona from './pages/Persona';
import PhotoUploader from './pages/PhotoUploader';
import PrintifySetup from './pages/PrintifySetup';

import ReadingSimple from './pages/ReadingSimple';
import Rebel8Ball from './pages/Rebel8Ball';
import SharedReading from './pages/SharedReading';
import SpreadCleaner from './pages/SpreadCleaner';
import SpreadManager from './pages/SpreadManager';
import SpreadSeeder from './pages/SpreadSeeder';
import SubscriptionManagement from './pages/SubscriptionManagement';
import Upgrade from './pages/Upgrade';
import UserProfile from './pages/UserProfile';
import WebhookTester from './pages/WebhookTester';
import WiccanSeeder from './pages/WiccanSeeder';
import ZodiacReading from './pages/ZodiacReading';
import AgentChat from './pages/AgentChat';
import CosmicHub from './pages/CosmicHub';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "AdminDeckReview": AdminDeckReview,
    "AdminTokenGrant": AdminTokenGrant,
    "AdminUsers": AdminUsers,
    "AstralTest": AstralTest,
    "CardGallery": CardGallery,
    "CardInfo": CardInfo,
    "CardNames": CardNames,
    "CreateDeck": CreateDeck,
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
    "Journal": Journal,
    "ManualsLibrary": ManualsLibrary,
    "MyFusions": MyFusions,
    "Persona": Persona,
    "PhotoUploader": PhotoUploader,
    "PrintifySetup": PrintifySetup,

    "ReadingSimple": ReadingSimple,
    "Rebel8Ball": Rebel8Ball,
    "SharedReading": SharedReading,
    "SpreadCleaner": SpreadCleaner,
    "SpreadManager": SpreadManager,
    "SpreadSeeder": SpreadSeeder,
    "SubscriptionManagement": SubscriptionManagement,
    "Upgrade": Upgrade,
    "UserProfile": UserProfile,
    "WebhookTester": WebhookTester,
    "WiccanSeeder": WiccanSeeder,
    "ZodiacReading": ZodiacReading,
    "AgentChat": AgentChat,
    "CosmicHub": CosmicHub,
}

export const pagesConfig = {
    mainPage: "CosmicHub",
    Pages: PAGES,
    Layout: __Layout,
};