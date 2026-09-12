const fs = require('fs');
const path = require('path');

const layoutFile = path.join(__dirname, 'src/components/Layout.tsx');
let layoutContent = fs.readFileSync(layoutFile, 'utf8');
layoutContent = layoutContent.replace(
  /import \{ AuthUser \} from '\.\.\/types';/,
  "import { AuthUser } from '../types/auth';"
);
layoutContent = layoutContent.replace(
  /setActiveTab: \(tab: string\) => void;/,
  "setActiveTab: (tab: any) => void;"
);
fs.writeFileSync(layoutFile, layoutContent);

const appFile = path.join(__dirname, 'src/App.tsx');
let appContent = fs.readFileSync(appFile, 'utf8');
appContent = appContent.replace(
  /const \[authMode, setAuthMode\] = useState\<'signin' \| 'signup'\>\('signin'\);/,
  "const [authMode, setAuthMode] = useState<any>('login');"
);
fs.writeFileSync(appFile, appContent);

