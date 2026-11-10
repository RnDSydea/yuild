import { buildDesktopPage } from './fixtureBuilder';
import { dashboardDefinitions } from './dashboard';
import { dataEntryFormDefinitions } from './dataEntryForm';
import { filteredTableDefinitions } from './filteredTable';
import { landingPageDefinitions } from './landingPage';
import { largePageDefinitions } from './largePage';
import { nestedContainersDefinitions } from './nestedContainers';

export const FIXTURE_PAGES = [
  { name: 'data entry form', definitions: dataEntryFormDefinitions },
  { name: 'dashboard with cards and charts', definitions: dashboardDefinitions },
  { name: 'table with filter bar', definitions: filteredTableDefinitions },
  { name: 'landing page with column sections', definitions: landingPageDefinitions },
  { name: 'page with containers nested on two levels', definitions: nestedContainersDefinitions },
  { name: 'page with more than one hundred components', definitions: largePageDefinitions },
];

export const buildFixturePage = (fixture) => buildDesktopPage(fixture.definitions);
