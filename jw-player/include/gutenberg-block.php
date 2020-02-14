<?php
function jwplayer_block_version() {
	return '0.1.0';
}

// Exit if accessed directly.
if (!defined('ABSPATH')) {
	exit;
}


add_action('init', function() {
	wp_register_script(
		'jwplayer-block-js',
		plugins_url('/static/js/jwplayer-embed.js', dirname(__FILE__)), /* dirname to toss /include/ from path */
		['wp-edit-post'],
		jwplayer_block_version(),
		true
	);
	register_block_type(
		'jwplayer-block/jwplayer-embed', [
			'editor_script'=> 'jwplayer-block-js',
		]
	);
});
