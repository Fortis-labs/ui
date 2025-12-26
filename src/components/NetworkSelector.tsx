import { useState } from 'react';
import { Button } from '../components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { ChevronDown } from 'lucide-react';
import { useNetwork, Network } from '../hooks/useNetwork';
import { useEffect } from 'react';
import { isValidUrl } from '../hooks/useNetwork';
export function NetworkSelector() {
    const { network, setNetwork, customRpc: appliedCustomRpc, setCustomRpc } = useNetwork();
    const [inputValue, setInputValue] = useState(appliedCustomRpc);

    // Sync input with applied value when switching networks
    useEffect(() => {
        setInputValue(appliedCustomRpc);
    }, [appliedCustomRpc]);

    const handleApply = () => {
        if (isValidUrl(inputValue)) {
            setCustomRpc(inputValue); // ✅ Only apply when valid
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApply();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Network:</span>
            <Select value={network} onValueChange={(v) => setNetwork(v as any)}>
                <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="mainnet">Mainnet</SelectItem>
                    <SelectItem value="devnet">Devnet</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
            </Select>

            {network === 'custom' && (
                <div className="flex items-center gap-1">
                    <Input
                        type="text"
                        placeholder="RPC URL"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`h-8 w-32 text-xs ${isValidUrl(inputValue) ? '' : 'border-red-500'}`}
                    />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleApply}
                        disabled={!isValidUrl(inputValue)}
                        className="h-8 px-2"
                    >
                        Apply
                    </Button>
                </div>
            )}
        </div>
    );
}

export default NetworkSelector;