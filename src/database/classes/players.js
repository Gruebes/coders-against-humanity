import firebase from '../../firebase';
import Base from '../base';

export default class Players extends Base {
  constructor() {
    super();
    this.collection = firebase.firestore().collection('/players');
    this.database = firebase.database();
    this.firestore = firebase.firestore();
  }
  async getPlayersByGameId(gameId) {
    return;
  }

  //   async create(docData = {}) {
  //     const ref = this.collection.doc();
  //     await ref.add(docData);
  //     const data = { ...(await ref.get()).data(), _id: ref.id };
  //     return { data, ref };
  //   }

  //   async update(docData) {
  //     const ref = this.collection.doc();
  //     await ref.set(docData, { merge: true, mergeField: true });
  //     const data = { ...(await ref.get()).data(), _id: ref.id };
  //     return { data, ref };
  //   }

  //   async set(docData) {
  //     const ref = this.collection.doc();
  //     await ref.set(docData);
  //     const data = { ...(await ref.get()).data(), _id: ref.id };
  //     return { data, ref };
  //   }
}
