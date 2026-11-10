// Take-a-break page: three quiet ideas, one button to see others. Not a feed.
import data from '../../packages/activities/activities.json';
import { pickActivities, type Activity } from './lib/activities';

const all: Activity[] = data.activities;
let shown: string[] = [];

function render(): void {
  const picks = pickActivities(all, 3, shown);
  shown = picks.map((a) => a.id);
  document.getElementById('ideas')!.replaceChildren(
    ...picks.map((a) => {
      const li = document.createElement('li');
      li.className = 'card idea';
      const group = document.createElement('span');
      group.className = 'pill on';
      group.textContent = a.group;
      const title = document.createElement('h2');
      title.textContent = a.title;
      const detail = document.createElement('p');
      detail.textContent = a.detail;
      li.append(group, title, detail);
      return li;
    }),
  );
}

document.getElementById('more')!.addEventListener('click', render);
render();
