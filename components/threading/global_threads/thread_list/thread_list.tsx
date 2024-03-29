// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {memo, useCallback, PropsWithChildren} from 'react';
import {FormattedMessage, useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {isEmpty} from 'lodash';

import {getThreadCountsInCurrentTeam} from 'mattermost-redux/selectors/entities/threads';
import {getThreads, markAllThreadsInTeamRead} from 'mattermost-redux/actions/threads';
import {$ID} from 'mattermost-redux/types/utilities';
import {UserThread} from 'mattermost-redux/types/threads';

import {Constants} from 'utils/constants';

import NoResultsIndicator from 'components/no_results_indicator';
import SimpleTooltip from 'components/widgets/simple_tooltip';
import Header from 'components/widgets/header';

import Button from '../../common/button';
import BalloonIllustration from '../../common/balloon_illustration';

import {useThreadRouting} from '../../hooks';

import VirtualizedThreadList from './virtualized_thread_list';

import './thread_list.scss';

export enum ThreadFilter {
    none = '',
    unread = 'unread'
}

export const FILTER_STORAGE_KEY = 'globalThreads_filter';

type Props = {
    currentFilter: ThreadFilter;
    someUnread: boolean;
    setFilter: (filter: ThreadFilter) => void;
    selectedThreadId?: $ID<UserThread>;
    ids: Array<$ID<UserThread>>;
    unreadIds: Array<$ID<UserThread>>;
};

const ThreadList = ({
    currentFilter = ThreadFilter.none,
    someUnread,
    setFilter,
    selectedThreadId,
    unreadIds,
    ids,
}: PropsWithChildren<Props>) => {
    const unread = ThreadFilter.unread === currentFilter;
    const data = unread ? unreadIds : ids;

    const {formatMessage} = useIntl();
    const dispatch = useDispatch();
    const {currentTeamId, currentUserId, clear} = useThreadRouting();

    const {total = 0, total_unread_threads: totalUnread} = useSelector(getThreadCountsInCurrentTeam);

    const handleRead = useCallback(() => {
        setFilter(ThreadFilter.none);
    }, [setFilter]);

    const handleUnread = useCallback(() => {
        setFilter(ThreadFilter.unread);
    }, [setFilter]);

    const handleLoadMoreItems = useCallback(async (startIndex) => {
        const before = data[startIndex - 1];
        await dispatch(getThreads(currentUserId, currentTeamId, {unread, perPage: Constants.THREADS_PAGE_SIZE, before}));
        return {data: true};
    }, [currentTeamId, data, unread]);

    const handleAllMarkedRead = useCallback(() => {
        dispatch(markAllThreadsInTeamRead(currentUserId, currentTeamId));
        if (currentFilter === ThreadFilter.unread) {
            clear();
        }
    }, [currentTeamId, currentUserId, currentFilter]);

    return (
        <div className={'ThreadList'}>
            <Header
                heading={(
                    <>
                        <Button
                            className={'Button___large Margined'}
                            isActive={currentFilter === ThreadFilter.none}
                            onClick={handleRead}
                        >
                            <FormattedMessage
                                id='threading.filters.allThreads'
                                defaultMessage='All your threads'
                            />
                        </Button>
                        <Button
                            className={'Button___large Margined'}
                            isActive={currentFilter === ThreadFilter.unread}
                            hasDot={someUnread}
                            onClick={handleUnread}
                        >
                            <FormattedMessage
                                id='threading.filters.unreads'
                                defaultMessage='Unreads'
                            />
                        </Button>
                    </>
                )}
                right={(
                    <div className='right-anchor'>
                        <SimpleTooltip
                            id='threadListMarkRead'
                            content={formatMessage({
                                id: 'threading.threadList.markRead',
                                defaultMessage: 'Mark all as read',
                            })}
                        >
                            <Button
                                className={'Button___large Button___icon'}
                                onClick={handleAllMarkedRead}
                            >
                                <span className='Icon'>
                                    <i className='icon-playlist-check'/>
                                </span>
                            </Button>
                        </SimpleTooltip>
                    </div>
                )}
            />
            <div className='threads'>
                <VirtualizedThreadList
                    key={`threads_list_${currentFilter}`}
                    loadMoreItems={handleLoadMoreItems}
                    ids={data}
                    selectedThreadId={selectedThreadId}
                    total={unread ? totalUnread : total}
                />
                {unread && !someUnread && isEmpty(unreadIds) ? (
                    <NoResultsIndicator
                        expanded={true}
                        iconGraphic={BalloonIllustration}
                        title={formatMessage({
                            id: 'globalThreads.threadList.noUnreadThreads',
                            defaultMessage: 'No unread threads',
                        })}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default memo(ThreadList);
