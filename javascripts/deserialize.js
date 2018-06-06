
(function ($) {
    // Jquery event doesn't work in chrome extension...
    function triggerNativeEvent(elem, eventName) {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent(eventName, true, true);
        elem[0].dispatchEvent(evt);
    }

    $.fn.extend({
        deserialize: function (d, config) {
            var currentDom,
                $current = null,
                $currentSavedValue = null,
                $self = $(this),
                i = 0,
                keyValPairString = [],
                keyValPairObject = d,
                tmp;
            
            if (d === null || d === undefined) {
                return $self;
            }

            if (d.constructor === String) {
                d = decodeURIComponent(d.replace(/\+/g, " "));
                keyValPairString = d.split('&');

                for (i = 0; i < keyValPairString.length; i++) {
                    tmp = keyValPairString[i].split('=');
                    keyValPairObject[tmp[0]] = tmp[1];
                }
            }

            $self.find(":input").not('button, input[type=image], input[type=submit], input[type=hidden], input[type=button]')
			.each(function (index) {
                $current = $(this);
                currentDom = $current.get(0);
				
				if (!$current.attr("id") && !$current.attr("name")){
					return true;
				}	
				
                var name = $current.attr("id");
                name = (name) ? name : $current.attr("name");
				
                $currentSavedValue = keyValPairObject[name];

                if (currentDom.disabled === true) {
                    return true;
                }

                if ($current.is('textarea')) {
                    if ($currentSavedValue === undefined) {
                        console.warn('Value for ' + name + ' not found');
                    } else {
                        $current.val($currentSavedValue);
                    }
                    triggerNativeEvent($current, 'change');
                    triggerNativeEvent($current, 'blur');
                    return true;
                }

                if ($current.is('select')) {
                    if ($currentSavedValue === undefined) {
                        return true;
                    } else {
                        $current.val($currentSavedValue);
                        triggerNativeEvent($current, 'change');
                        triggerNativeEvent($current, 'blur');
                    }
                    return true;
                }

                if ($current.is('input:radio')) {
                    if ($currentSavedValue !== undefined) {

                        $current.each(function () {
                            if ($(this).val() === $currentSavedValue) {
                                $(this).get(0).checked = true;
                                $(this).get(0).click();
                            }
                        });
                    }

                    return true;
                }

                if ($current.is('input:checkbox')) {
                    if ($currentSavedValue !== undefined) {
                        if (($current.val() === $currentSavedValue) || ($currentSavedValue === "true")) {
                            $(this).prop('checked', true);
                        } else {
                            $(this).prop('checked', false);
                        }
                        triggerNativeEvent($current, 'change');
                        triggerNativeEvent($current, 'blur');
                    }
                    return true;
                }

                if ($current.is('input:text, input:password, input[type=email], input[type=number], input[type=search], input[type=tel], input[type=url], input[type=date]')) {
                    if ($currentSavedValue === undefined) {
                        console.warn('Value for ' + name + ' not found');
                    } else {
                        $current.val($currentSavedValue);
                    }
                    triggerNativeEvent($current, 'change');
                    triggerNativeEvent($current, 'blur');
                    return true;
                }

            });

            return $self;
        }

    });

}(jQuery));
