import firebase from '../firebase';

export default class Base {
  constructor() {
    this.text = 'hello';
    debugger;
  }
  async create(docData = {}) {
    const ref = this.collection.doc();
    await ref.add(docData);
    const data = { ...(await ref.get()).data(), _id: ref.id };
    return { data, ref };
  }

  async update(docData) {
    const ref = this.collection.doc();
    await ref.set(docData, { merge: true, mergeField: true });
    const data = { ...(await ref.get()).data(), _id: ref.id };
    return { data, ref };
  }

  async set(docData) {
    const ref = this.collection.doc();
    await ref.set(docData);
    const data = { ...(await ref.get()).data(), _id: ref.id };
    return { data, ref };
  }
}
