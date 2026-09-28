import { useApp } from '../store/context'
import TaskModal from './TaskModal'
import ProjectModal from './ProjectModal'
import ConfirmDialog from './ConfirmDialog'

export default function ModalsHost() {
  const { modal, closeModal } = useApp()

  return (
    <>
      <TaskModal
        open={modal?.type === 'task'}
        task={modal?.task ?? null}
        defaults={modal?.defaults ?? {}}
        onClose={closeModal}
      />
      <ProjectModal open={modal?.type === 'project'} project={modal?.project ?? null} onClose={closeModal} />
      <ConfirmDialog open={modal?.type === 'confirm'} config={modal?.config} onClose={closeModal} />
    </>
  )
}
