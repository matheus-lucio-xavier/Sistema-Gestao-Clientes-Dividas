export default function Modal({ children, open, onClose}) {
    return <div className={`modal ${open ? "" : "hidden"}`}>
        {children}
    </div>
}
