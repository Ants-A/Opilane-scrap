import { render } from 'solid-js/web';
import { MetaProvider } from '@solidjs/meta';
import App from './App';

render(() => <MetaProvider><App /></MetaProvider>, document.getElementById('root')!);
