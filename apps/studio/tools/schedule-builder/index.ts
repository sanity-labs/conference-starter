import {definePlugin} from 'sanity'
import {CalendarIcon} from '@sanity/icons'
import {ScheduleBuilder} from './components/ScheduleBuilder'

export const scheduleBuilder = definePlugin({
  name: 'schedule-builder',
  tools: [
    {
      name: 'schedule-builder',
      title: 'Schedule',
      icon: CalendarIcon,
      component: ScheduleBuilder,
    },
  ],
})
