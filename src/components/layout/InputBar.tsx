
interface inputProps {
    children?: React.ReactNode;
    default_value: string;
    onClick: () => void;
}

export default function InputBar(props: inputProps): React.JSX.Element {
return (
    <div>
        <form action="/submit_page.php" method="Get">
            <label htmlFor="Study">Name:</label>
            <input type="text" id="name" name="name"/>
            <input type="submit" value="Submit"/>
        </form>
    </div>)
}