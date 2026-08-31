'use strict';

const paragraph = (text) => [{
  type: 'paragraph',
  children: [{ type: 'text', text }],
}];

/** The routes currently rendered by the React website. */
module.exports = [
  {
    title: 'Home', slug: 'home', route: '/', navLabel: 'Home', template: 'home',
    heroTitle: '1847 Liberty',
    heroSubtitle: 'News, conversation, and community for Liberia and its diaspora.',
    seoTitle: '1847 Liberty',
    seoDescription: 'The home of the 1847 Liberty show, polls, and commentary.',
    content: paragraph('Use this page to manage the homepage introduction and featured content.'),
  },
  {
    title: 'Podcast', slug: 'podcast', route: '/podcast', navLabel: 'Podcast', template: 'podcast',
    heroTitle: 'The 1847 Liberty Show',
    seoTitle: 'Podcast | 1847 Liberty',
    seoDescription: 'Episodes of the 1847 Liberty Show.',
    content: paragraph('Manage episode descriptions and featured videos from the Episodes collection.'),
  },
  {
    title: 'Playlist', slug: 'playlist', route: '/playlist', navLabel: 'Playlist', template: 'playlist',
    heroTitle: 'Playlist',
    seoTitle: 'Playlist | 1847 Liberty',
    seoDescription: 'Selected videos and playlists from 1847 Liberty.',
    content: paragraph('Add the introduction and supporting copy for the playlist page.'),
  },
  {
    title: 'About', slug: 'about', route: '/about', navLabel: 'About', template: 'about',
    heroTitle: 'About 1847 Liberty',
    seoTitle: 'About | 1847 Liberty',
    seoDescription: 'Learn about 1847 Liberty and its mission.',
    content: paragraph('Tell visitors about the mission, host, and team behind 1847 Liberty.'),
  },
  {
    title: 'Contact', slug: 'contact', route: '/contact', navLabel: 'Contact', template: 'contact',
    heroTitle: 'Contact Us',
    seoTitle: 'Contact | 1847 Liberty',
    seoDescription: 'Get in touch with the 1847 Liberty team.',
    content: paragraph('Add contact instructions and editorial response expectations.'),
  },
  {
    title: 'Book Michael', slug: 'book-michael', route: '/book', navLabel: 'Book Michael', template: 'booking',
    heroTitle: 'Book Michael',
    seoTitle: 'Book Michael | 1847 Liberty',
    seoDescription: 'Invite Michael to speak, host, or participate in your event.',
    content: paragraph('Describe booking availability, event formats, and enquiry requirements.'),
  },
  {
    title: 'Advertising', slug: 'advertising', route: '/advertising', navLabel: 'Advertising', template: 'advertising',
    heroTitle: 'Advertise with 1847 Liberty',
    seoTitle: 'Advertising | 1847 Liberty',
    seoDescription: 'Advertising and partnership opportunities.',
    content: paragraph('Describe advertising formats, audience information, and partnership enquiries.'),
  },
];
