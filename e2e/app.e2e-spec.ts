import { ProjectionCliPage } from './app.po';

describe('projection-cli App', function() {
  let page: ProjectionCliPage;

  beforeEach(() => {
    page = new ProjectionCliPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
