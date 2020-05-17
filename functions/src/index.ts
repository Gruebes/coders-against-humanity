import { chooseBlack } from './cards/chooseBlack';
import { dealCards } from './cards/deal';
import { tradeCards } from './cards/trade';

import admin = require('firebase-admin');
admin.initializeApp();

export { chooseBlack, dealCards, tradeCards };
