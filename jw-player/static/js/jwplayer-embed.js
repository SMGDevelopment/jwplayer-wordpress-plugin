let VideoSelector;

(()=> {
	const	{registerBlockType}= wp.blocks,
		{Path, SVG, Spinner, TextControl}= wp.components,
		{createElement, Component}= wp.element,
		el= createElement;
	registerBlockType(
		'jwplayer-block/jwplayer-embed', {
			title: 'JWPlayer Video',
			icon: el(SVG, { 
					alt: 'JWPlayer',
					viewBox: '0 0 133.48 133.48',
					xmlns: 'http://www.w3.org/2000/svg',
					width: 24,
					height: 24,
					role: 'img',
					focusable: 'false',
				},
					el(Path, {
						fill: '#ec0041',
						d: 'M125.9.41a4.56 4.56 0 0 0-6 2.21c-1.1 2.3-29 69.66-29 69.66-.9 2.11-1.5 1.91-1.5-.3 0 0 .1-23.45.2-42.8.1-10.52-5.11-16.44-12.43-17.64a14 14 0 0 0-9.62 2.11 20.63 20.63 0 0 0-6.82 8.11c-2.2 4.31-15.83 44-15.83 44-.71 2.1-1.41 2-1.41-.2 0 0-.4-17.14-.8-21.15-.6-6.22-2-16.34-10-16.84-7.52-.5-10.93 8.82-12.83 14.53-1.31 3.81-7.52 24.36-7.52 24.36l-.9 2.1c-.3 1.11-.8 1.11-1.11 0l-.5-1.9a62.57 62.57 0 0 0-1.9-6 8.6 8.6 0 0 0-1.5-3 3.75 3.75 0 0 0-4-1A3.71 3.71 0 0 0 0 59.75a21.8 21.8 0 0 0 .3 3.61C.82 67 3.43 81.2 5 84.31s5 4.71 8.22 3c3-1.61 4.41-5.31 5.61-8.22 1.53-3.71 9.23-25 9.23-25 .8-2.1 1.4-2 1.3.2 0 0-.4 20.85-.4 30.27 0 3.51.3 9.92 1.3 13.33a10.86 10.86 0 0 0 3.74 5.87 9.27 9.27 0 0 0 6.41 1.8 8.63 8.63 0 0 0 3.21-1.1 13.84 13.84 0 0 0 3.61-3.21 58.32 58.32 0 0 0 5.71-9.62c3.71-7.32 13.34-30 13.34-30 .9-2.11 1.5-1.91 1.5.3 0 0-1.2 38.09-1.2 52.62a29.71 29.71 0 0 0 2 10.63 12.8 12.8 0 0 0 6.62 7.31 11.54 11.54 0 0 0 10.42-.6 16.65 16.65 0 0 0 5.81-6 66.8 66.8 0 0 0 4.92-10.53c2.9-7.51 5.31-15.13 7.71-22.85S126.8 12.14 128.1 5.93a7.49 7.49 0 0 0 .2-2.11 4.53 4.53 0 0 0-2.4-3.41z',
					})
				),
			category: 'embed',
			attributes: {
				key: {
					type: 'string',
				},
			},
			edit: class JwBlockEdit extends Component {
				constructor(...args) {
					super(...args);
					this.setVideo= this.setVideo.bind(this);
				}
				setVideo(v) {
					if (!v)
						return console.log('what you talkin about, willis?');
					this.props.setAttributes({key: `${v.key}`});
				}
				componentDidMount() {
					/* import jw selector here, so we can guarantee a subsequent paint event */
					const {key}= this.props.attributes;
					const paint= ()=> this.forceUpdate();
					import('./jwplayer-selector.js').then(imp=> {
						VideoSelector= imp.default;
						paint();
					});	
				}
				render() {
					const	{key}= this.props.attributes;
					return el(
						'div', null,
							key && el('img', {src:  `http://content.jwplatform.com/thumbs/${key}-40.jpg`}),
							key	? el('div', null, `[jwplayer ${key}]`)
								: VideoSelector
									? el(VideoSelector, {onVideoSelect: this.setVideo})
									: el('div', null,
										el(Spinner), '... loading JW VideoSelector')
					)
				}
			},
			save: class JwBlockSave extends Component {
				render (props) {
					const {key}= this.props.attributes;	
					return el('div', null, key ? `[jwplayer ${key}]` :null);
				}
			},
		}
	);
})();
