export type Trash = {
    plastic: number;
    glass: number;
    paper: number;
  };
  
  export type Resources = {
    water: number;
    feed: number;
    trash: Trash;
  };