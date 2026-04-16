export type Trash = {
  plastic: number;
  glass: number;
  paper: number;
  bio: number;
};

export type Resources = {
  water: number;
  feed: number;
  trash: Trash;
};