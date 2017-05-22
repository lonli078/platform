// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See License.txt for license information.

import $ from 'jquery';
import ReactDOM from 'react-dom';

import PostTime from 'components/post_view/post_time.jsx';
import PostFlagIcon from 'components/post_view/post_flag_icon.jsx';

import * as GlobalActions from 'actions/global_actions.jsx';

import * as Utils from 'utils/utils.jsx';
import * as PostUtils from 'utils/post_utils.jsx';
import Constants from 'utils/constants.jsx';
import DelayedAction from 'utils/delayed_action.jsx';
import {Overlay} from 'react-bootstrap';
import EmojiPicker from 'components/emoji_picker/emoji_picker.jsx';

import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';

export default class PostInfo extends React.PureComponent {
    static propTypes = {
        post: PropTypes.object.isRequired,
        handleCommentClick: PropTypes.func.isRequired,
        handleDropdownOpened: PropTypes.func.isRequired,
        compactDisplay: PropTypes.bool,
        useMilitaryTime: PropTypes.bool.isRequired,
        isFlagged: PropTypes.bool,
        canDelete: PropTypes.bool,
        consecutivePostByUser: PropTypes.bool,
        replyCount: PropTypes.number,
        lastPostCount: PropTypes.number,
        actions: PropTypes.shape({
            removePost: PropTypes.func.isRequired,
            flagPost: PropTypes.func.isRequired,
            unflagPost: PropTypes.func.isRequired,
            pinPost: PropTypes.func.isRequired,
            unpinPost: PropTypes.func.isRequired,
            addReaction: PropTypes.func.isRequired
        }).isRequired
    }

    constructor(props) {
        super(props);

        this.handleDropdownOpened = this.handleDropdownOpened.bind(this);
        this.handlePermalink = this.handlePermalink.bind(this);
        this.removePost = this.removePost.bind(this);
        this.flagPost = this.flagPost.bind(this);
        this.unflagPost = this.unflagPost.bind(this);
        this.pinPost = this.pinPost.bind(this);
        this.unpinPost = this.unpinPost.bind(this);
        this.reactEmojiClick = this.reactEmojiClick.bind(this);
        this.emojiPickerClick = this.emojiPickerClick.bind(this);

        this.editDisableAction = new DelayedAction(this.handleEditDisable);

        this.state = {
            showEmojiPicker: false,
            reactionPickerOffset: 21,
            canEdit: PostUtils.canEditPost(props.post, this.editDisableAction)
        };
    }

    handleDropdownOpened() {
        this.props.handleDropdownOpened(true);

        const position = $('#post-list').height() - $(this.refs.dropdownToggle).offset().top;
        const dropdown = $(this.refs.dropdown);

        if (position < dropdown.height()) {
            dropdown.addClass('bottom');
        }
    }

    handleEditDisable() {
        this.setState({canEdit: false});
    }

    componentDidMount() {
        $('#post_dropdown' + this.props.post.id).on('shown.bs.dropdown', this.handleDropdownOpened);
        $('#post_dropdown' + this.props.post.id).on('hidden.bs.dropdown', () => this.props.handleDropdownOpened(false));
    }

    createDropdown(isSystemMessage) {
        const post = this.props.post;

        var type = 'Post';
        if (post.root_id && post.root_id.length > 0) {
            type = 'Comment';
        }

        var dropdownContents = [];
        var dataComments = 0;
        if (type === 'Post') {
            dataComments = this.props.replyCount;
        }

        if (!isSystemMessage) {
            dropdownContents.push(
                <li
                    key='replyLink'
                    role='presentation'
                >
                    <a
                        className='link__reply theme'
                        href='#'
                        onClick={this.props.handleCommentClick}
                    >
                        <FormattedMessage
                            id='post_info.reply'
                            defaultMessage='Reply'
                        />
                    </a>
                </li>
             );
        }

        if (Utils.isMobile()) {
            if (this.props.isFlagged) {
                dropdownContents.push(
                    <li
                        key='mobileFlag'
                        role='presentation'
                    >
                        <a
                            href='#'
                            onClick={this.unflagPost}
                        >
                            <FormattedMessage
                                id='rhs_root.mobile.unflag'
                                defaultMessage='Unflag'
                            />
                        </a>
                    </li>
                );
            } else {
                dropdownContents.push(
                    <li
                        key='mobileFlag'
                        role='presentation'
                    >
                        <a
                            href='#'
                            onClick={this.flagPost}
                        >
                            <FormattedMessage
                                id='rhs_root.mobile.flag'
                                defaultMessage='Flag'
                            />
                        </a>
                    </li>
                );
            }
        }

        if (!isSystemMessage) {
            dropdownContents.push(
                <li
                    key='copyLink'
                    role='presentation'
                >
                    <a
                        href='#'
                        onClick={this.handlePermalink}
                    >
                        <FormattedMessage
                            id='post_info.permalink'
                            defaultMessage='Permalink'
                        />
                    </a>
                </li>
            );

            if (this.props.post.is_pinned) {
                dropdownContents.push(
                    <li
                        key='unpinLink'
                        role='presentation'
                    >
                        <a
                            href='#'
                            onClick={this.unpinPost}
                        >
                            <FormattedMessage
                                id='post_info.unpin'
                                defaultMessage='Un-pin from channel'
                            />
                        </a>
                    </li>
                );
            } else {
                dropdownContents.push(
                    <li
                        key='pinLink'
                        role='presentation'
                    >
                        <a
                            href='#'
                            onClick={this.pinPost}
                        >
                            <FormattedMessage
                                id='post_info.pin'
                                defaultMessage='Pin to channel'
                            />
                        </a>
                    </li>
                );
            }
        }

        if (this.props.canDelete) {
            dropdownContents.push(
                <li
                    key='deletePost'
                    role='presentation'
                >
                    <a
                        href='#'
                        role='menuitem'
                        onClick={(e) => {
                            e.preventDefault();
                            GlobalActions.showDeletePostModal(post, dataComments);
                        }}
                    >
                        <FormattedMessage
                            id='post_info.del'
                            defaultMessage='Delete'
                        />
                    </a>
                </li>
            );
        }

        if (this.state.canEdit) {
            dropdownContents.push(
                <li
                    key='editPost'
                    role='presentation'
                    className={'dropdown-submenu'}
                >
                    <a
                        href='#'
                        role='menuitem'
                        data-toggle='modal'
                        data-target='#edit_post'
                        data-refocusid='#post_textbox'
                        data-title={type}
                        data-message={post.message}
                        data-postid={post.id}
                        data-channelid={post.channel_id}
                        data-comments={dataComments}
                    >
                        <FormattedMessage
                            id='post_info.edit'
                            defaultMessage='Edit'
                        />
                    </a>
                </li>
            );
        }

        if (dropdownContents.length === 0) {
            return '';
        }

        return (
            <div
                id={'post_dropdown' + this.props.post.id}
            >
                <a
                    ref='dropdownToggle'
                    href='#'
                    className='dropdown-toggle post__dropdown theme'
                    type='button'
                    data-toggle='dropdown'
                    aria-expanded='false'
                />
                <div className='dropdown-menu__content'>
                    <ul
                        ref='dropdown'
                        className='dropdown-menu'
                        role='menu'
                    >
                        {dropdownContents}
                    </ul>
                </div>
            </div>
        );
    }

    handlePermalink(e) {
        e.preventDefault();
        GlobalActions.showGetPostLinkModal(this.props.post);
    }

    emojiPickerClick() {
        this.setState({showEmojiPicker: !this.state.showEmojiPicker});
    }

    removePost() {
        this.props.actions.removePost(this.props.post);
    }

    createRemovePostButton() {
        return (
            <a
                href='#'
                className='post__remove theme'
                type='button'
                onClick={this.removePost}
            >
                {'×'}
            </a>
        );
    }

    pinPost(e) {
        e.preventDefault();
        this.props.actions.pinPost(this.props.post.channel_id, this.props.post.id);
    }

    unpinPost(e) {
        e.preventDefault();
        this.props.actions.unpinPost(this.props.post.channel_id, this.props.post.id);
    }

    flagPost(e) {
        e.preventDefault();
        this.props.actions.flagPost(this.props.post.id);
    }

    unflagPost(e) {
        e.preventDefault();
        this.props.actions.unflagPost(this.props.post.id);
    }

    reactEmojiClick(emoji) {
        const pickerOffset = 21;
        this.setState({showEmojiPicker: false, reactionPickerOffset: pickerOffset});
        const emojiName = emoji.name || emoji.aliases[0];
        this.props.actions.addReaction(this.props.post.id, emojiName);
    }

    render() {
        const post = this.props.post;

        let idCount = -1;
        if (this.props.lastPostCount >= 0 && this.props.lastPostCount < Constants.TEST_ID_COUNT) {
            idCount = this.props.lastPostCount;
        }

        const isEphemeral = Utils.isPostEphemeral(post);
        const isPending = post.state === Constants.POST_FAILED || post.state === Constants.POST_LOADING;
        const isSystemMessage = PostUtils.isSystemMessage(post);

        let comments = null;
        let react = null;
        if (!isEphemeral && !isPending && !isSystemMessage) {
            let showCommentClass;
            let commentCountText;
            if (post.replyCount >= 1) {
                showCommentClass = ' icon--show';
                commentCountText = post.replyCount;
            } else {
                showCommentClass = '';
                commentCountText = '';
            }

            comments = (
                <a
                    href='#'
                    className={'comment-icon__container' + showCommentClass}
                    onClick={this.props.handleCommentClick}
                >
                    <span
                        className='comment-icon'
                        dangerouslySetInnerHTML={{__html: Constants.REPLY_ICON}}
                    />
                    <span className='comment-count'>
                        {commentCountText}
                    </span>
                </a>
            );

            if (Utils.isFeatureEnabled(Constants.PRE_RELEASE_FEATURES.EMOJI_PICKER_PREVIEW)) {
                react = (
                    <span>
                        <Overlay
                            show={this.state.showEmojiPicker}
                            placement='top'
                            rootClose={true}
                            container={this}
                            onHide={() => this.setState({showEmojiPicker: false})}
                            target={() => ReactDOM.findDOMNode(this.refs['reactIcon_' + post.id])}
                            animation={false}
                        >
                            <EmojiPicker
                                onEmojiClick={this.reactEmojiClick}
                                pickerLocation='top'

                            />
                        </Overlay>
                        <a
                            href='#'
                            className='reacticon__container'
                            onClick={this.emojiPickerClick}
                            ref={'reactIcon_' + post.id}
                        ><i className='fa fa-smile-o'/>
                        </a>
                    </span>

                );
            }
        }

        let options;
        if (isEphemeral) {
            options = (
                <li className='col col__remove'>
                    {this.createRemovePostButton()}
                </li>
            );
        } else if (!isPending) {
            const dropdown = this.createDropdown(isSystemMessage);

            if (dropdown) {
                options = (
                    <li className='col col__reply'>
                        <div
                            className='dropdown'
                            ref='dotMenu'
                        >
                            {dropdown}
                        </div>
                        {react}
                        {comments}
                    </li>
                );
            }
        }

        let pinnedBadge;
        if (post.is_pinned) {
            pinnedBadge = (
                <span className='post__pinned-badge'>
                    <FormattedMessage
                        id='post_info.pinned'
                        defaultMessage='Pinned'
                    />
                </span>
            );
        }

        return (
            <ul className='post__header--info'>
                <li className='col'>
                    <PostTime
                        eventTime={post.create_at}
                        sameUser={this.props.consecutivePostByUser}
                        compactDisplay={this.props.compactDisplay}
                        useMilitaryTime={this.props.useMilitaryTime}
                        postId={post.id}
                    />
                    {pinnedBadge}
                    {this.state.showEmojiPicker}
                    <PostFlagIcon
                        idPrefix={'centerPostFlag'}
                        idCount={idCount}
                        postId={post.id}
                        isFlagged={this.props.isFlagged}
                        isEphemeral={isEphemeral}
                    />
                </li>
                {options}
            </ul>
        );
    }
}
